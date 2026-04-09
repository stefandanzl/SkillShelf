import type {
	TypedPocketBase,
	BoxesRecord,
	CardsRecord,
	CardProgressRecord,
	BoxesColorOptions,
	// BoxesLearnDirectionOptions,
	BoxesResponse,
	CardsResponse,
	CardProgressResponse,
	CoursesRecord,
	CoursesResponse,
	ImagesRecord,
	ImagesResponse
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
	data: {
		name: string;
		color: BoxesColorOptions;
		learn_direction?: BoxesLearnDirectionOptions;
		tts_language?: string;
		course?: string;
	}
): Promise<BoxesResponse> {
	const ownerId = pb.authStore.record?.id;
	return pb.collection('boxes').create({
		name: data.name,
		owner: ownerId,
		color: data.color,
		learn_direction: data.learn_direction ?? BoxesLearnDirectionOptions.front_to_back,
		tts_language: data.tts_language ?? '',
		course: data.course ?? ''
	});
}

export async function updateBox(
	pb: TypedPocketBase,
	id: string,
	data: Partial<Pick<BoxesRecord, 'name' | 'color' | 'learn_direction' | 'tts_language' | 'course'>>
): Promise<BoxesResponse> {
	return pb.collection('boxes').update(id, data);
}

// ── Courses ───────────────────────────────────────────────────────────────────

export async function getCourses(pb: TypedPocketBase): Promise<CoursesRecord[]> {
	const userId = pb.authStore.record?.id;
	const result = await pb.collection('courses').getList(1, 200, {
		filter: `user = "${userId}"`,
		sort: 'name'
	});
	return result.items;
}

export async function createCourse(
	pb: TypedPocketBase,
	data: { name: string; color?: string }
): Promise<CoursesResponse> {
	const userId = pb.authStore.record?.id;
	return pb.collection('courses').create({
		name: data.name,
		color: data.color ?? '',
		user: userId
	});
}

export async function updateCourse(
	pb: TypedPocketBase,
	id: string,
	data: Partial<Pick<CoursesRecord, 'name' | 'color' | 'archived'>>
): Promise<CoursesResponse> {
	return pb.collection('courses').update(id, data);
}

export async function deleteCourse(pb: TypedPocketBase, id: string): Promise<void> {
	await pb.collection('courses').delete(id);
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
	// Clean up associated progress records  !!! Not needed with cascadeDelete: true set in Pocketbase!
	// try {
	// 	const progressRecords = await pb.collection('card_progress').getList(1, 50, {
	// 		filter: `card = "${id}"`
	// 	});
	// 	await Promise.all(progressRecords.items.map(p => pb.collection('card_progress').delete(p.id)));
	// } catch (e) {
	// 	// Progress cleanup is best-effort
	// }
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
	return cards.map((card) => ({
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

export function buildLevelCounts(
	progressList: CardProgressRecord[],
	totalCards: number
): { levels: number[]; starred: number } {
	// levels: array of 7, index 0-6 = levels 1-7
	// starred: count of starred cards (independent of level)
	const levels = Array(7).fill(0);
	let starred = 0;
	const progressMap = new Map(progressList.map((p) => [p.card, p]));

	// Cards with no progress record = level 1
	const withProgress = progressMap.size;
	levels[0] += totalCards - withProgress; // unreviewed → level 1

	for (const p of progressList) {
		if (p.starred) starred++;
		// Starred cards still count in their level bucket
		const level = Math.max(1, Math.min(7, p.level ?? 1));
		levels[level - 1]++;
	}
	return { levels, starred };
}

// ── Images ─────────────────────────────────────────────────────────────────────

export async function getImagesForBox(pb: TypedPocketBase, boxId: string): Promise<ImagesRecord[]> {
	// Get all images that include this box in their boxes array
	const result = await pb.collection('images').getList(1, 500, {
		filter: `boxes ~ "${boxId}"`
	});
	return result.items;
}

export async function findOrCreateImage(
	pb: TypedPocketBase,
	boxId: string,
	filename: string,
	hash: string,
	file: File
): Promise<ImagesResponse> {
	// First, try to find an existing image with this hash
	const existing = await pb.collection('images').getList(1, 1, {
		filter: `hash = "${hash}"`
	});

	if (existing.items.length > 0) {
		const image = existing.items[0];
		// Check if this box is already in the boxes array
		if (!image.boxes.includes(boxId as any)) {
			// Add this box to the boxes array
			const updatedBoxes = [...image.boxes, boxId];
			return pb.collection('images').update(image.id, { boxes: updatedBoxes as any });
		}
		return image;
	}

	// Create new image
	return pb.collection('images').create({
		boxes: [boxId],
		original_filename: filename,
		hash,
		image_file: file
	});
}

// Build a filename → URL map for a box's images
export async function buildImageMap(pb: TypedPocketBase, boxId: string): Promise<Record<string, string>> {
	const images = await getImagesForBox(pb, boxId);
	const map: Record<string, string> = {};

	for (const image of images) {
		// Get the URL for the image file
		const url = pb.files.getURL(image, image.image_file);
		map[image.original_filename] = url;
	}

	return map;
}
