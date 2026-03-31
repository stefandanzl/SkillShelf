import type {
	TypedPocketBase,
	BoxesRecord,
	CardsRecord,
	CardProgressRecord,
	BoxesColorOptions,
	// BoxesLearnDirectionOptions,
	BoxesResponse,
	CardsResponse,
	CardProgressResponse
} from '$lib/pocketbase-types';
import { BoxesLearnDirectionOptions } from '$lib/pocketbase-types';
import { processAnswer } from './leitner';
import { error } from '@sveltejs/kit';

// ── Boxes ─────────────────────────────────────────────────────────────────────

export async function getBoxes(pb: TypedPocketBase): Promise<BoxesRecord[]> {
	const result = await pb.collection('boxes').getList(1, 200, {
		sort: '-created'
	});
	return result.items;
}

export async function getBox(pb: TypedPocketBase, id: string): Promise<BoxesResponse> {
	return pb.collection('boxes').getOne(id);
}

export async function createBox(
	pb: TypedPocketBase,
	data: { name: string; color: BoxesColorOptions; learn_direction?: BoxesLearnDirectionOptions; tts_language?: string }
): Promise<BoxesResponse> {
	const ownerId = pb.authStore.record?.id;
	return pb.collection('boxes').create({
		name: data.name,
		owner: ownerId,
		color: data.color,
		learn_direction: data.learn_direction ?? BoxesLearnDirectionOptions.front_to_back,
		tts_language: data.tts_language ?? ''
	});
}

export async function updateBox(
	pb: TypedPocketBase,
	id: string,
	data: Partial<Pick<BoxesRecord, 'name' | 'color' | 'learn_direction' | 'tts_language'>>
): Promise<BoxesResponse> {
	return pb.collection('boxes').update(id, data);
}

export async function deleteBox(pb: TypedPocketBase, id?: string): Promise<void> {
	if (!id) throw new Error('id undefined!');
	await pb.collection('boxes').delete(id);
}

// ── Cards ─────────────────────────────────────────────────────────────────────

export async function getCards(pb: TypedPocketBase, boxId: string): Promise<CardsRecord[]> {
	const result = await pb.collection('cards').getList(1, 500, {
		filter: `box = "${boxId}"`,
		sort: 'sort_order,created'
	});
	return result.items;
}

export async function createCard(
	pb: TypedPocketBase,
	boxId: string,
	data: { front: string; back: string }
): Promise<CardsResponse> {
	return pb.collection('cards').create({
		box: boxId,
		front: data.front,
		back: data.back,
		sort_order: Date.now()
	});
}

export async function updateCard(
	pb: TypedPocketBase,
	id: string | undefined,
	data: { front?: string; back?: string }
): Promise<CardsResponse> {
	if (!id) {
		throw new Error('id empty: ' + id);
	}
	return pb.collection('cards').update(id, data);
}

export async function deleteCard(pb: TypedPocketBase, id: string | undefined): Promise<void> {
	if (!id) {
		throw new Error('id empty: ' + id);
	}
	// Clean up associated progress records
	try {
		const progressRecords = await pb.collection('card_progress').getList(1, 50, {
			filter: `card = "${id}"`
		});
		await Promise.all(progressRecords.items.map(p => pb.collection('card_progress').delete(p.id)));
	} catch (e) {
		// Progress cleanup is best-effort
	}
	await pb.collection('cards').delete(id);
}

// ── Card Progress ─────────────────────────────────────────────────────────────

export async function getProgressForBox(pb: TypedPocketBase, boxId: string): Promise<CardProgressResponse[]> {
	const result = await pb.collection('card_progress').getList(1, 500, {
		filter: `box = "${boxId}"`
	});
	return result.items;
}

export async function getDueCards(
	pb: TypedPocketBase,
	boxId: string
): Promise<Array<{ card: CardsRecord; progress: CardProgressRecord | null }>> {
	// Get all cards in box
	const cards = await getCards(pb, boxId);

	// Get all progress records for this box
	const progressList = await getProgressForBox(pb, boxId);
	const progressMap = new Map(progressList.map((p) => [p.card, p]));

	// Return all cards with their progress
	return cards.map(card => ({
		card,
		progress: progressMap.get(card.id) ?? null
	}));
}

export async function submitAnswer(
	pb: TypedPocketBase,
	card: CardsRecord,
	existingProgress: CardProgressRecord | null,
	wasCorrect: boolean,
	starred?: boolean
): Promise<CardProgressRecord> {
	const userId = pb.authStore.record?.id;
	if (!userId) throw new Error('Not authenticated');

	const current = existingProgress ?? { level: 1, streak: 0 };
	const update = processAnswer(current as CardProgressRecord, wasCorrect);

	if (existingProgress) {
		const data: Record<string, unknown> = { ...update };
		if (starred !== undefined) data.starred = starred;
		return pb.collection('card_progress').update(existingProgress.id, data);
	} else {
		return pb.collection('card_progress').create({
			user: userId,
			card: card.id,
			box: card.box,
			level: update.level,
			starred: starred ?? false,
			last_reviewed: update.last_reviewed,
			next_review: update.next_review,
			streak: update.streak
		});
	}
}

// ── Level counts (for Leitner grid) ──────────────────────────────────────────

export function buildLevelCounts(progressList: CardProgressRecord[], totalCards: number): number[] {
	// returns array of 8: index 0-6 = levels 1-7, index 7 = starred
	const counts = Array(8).fill(0);
	const progressMap = new Map(progressList.map((p) => [p.card, p]));

	// Cards with no progress record = level 1
	const withProgress = progressMap.size;
	counts[0] += totalCards - withProgress; // unreviewed → level 1

	for (const p of progressList) {
		if (p.starred) {
			counts[7]++;
		} else {
			// Clamp level to valid range 1-7, default to 1 if null/undefined/invalid
			const level = Math.max(1, Math.min(7, p.level ?? 1));
			counts[level - 1]++;
		}
	}
	return counts;
}
