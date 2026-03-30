import { browser } from '$app/environment';
import { pb } from '$lib/pocketbase.svelte';
import { getBoxes, buildLevelCounts } from '$lib/api';
import { isDueToday } from '$lib/leitner';
import { syncLocaleFromUser } from '$lib/i18n';
import type { PageLoad } from './$types';
import type { CardsRecord, CardProgressRecord, BoxesRecord } from '$lib/pocketbase-types';

export const load: PageLoad = async () => {
	// Skip on server - let client handle it
	if (!browser) {
		return { boxSummaries: [] };
	}

	// Reload cookie to get latest auth state (fixes race after login)
	pb.authStore.loadFromCookie(document.cookie);

	if (!pb.authStore.isValid) {
		return { boxSummaries: [] };
	}

	// Sync locale from user profile
	syncLocaleFromUser();

	try {
		// 1. Get all boxes for this user
		const boxes = await getBoxes(pb);

		if (boxes.length === 0) {
			return { boxSummaries: [] };
		}

		// 2. Get ALL cards for user's boxes in ONE request
		// Build filter: box = "id1" || box = "id2" || ...
		const boxFilter = boxes.map(b => `box = "${b.id}"`).join(' || ');
		const cardsResult = await pb.collection('cards').getList(1, 1000, {
			filter: boxFilter,
			sort: 'sort_order,created'
		});
		const allCards = cardsResult.items;

		// 3. Get ALL progress for this user in ONE request
		const progressResult = await pb.collection('card_progress').getList(1, 1000, {
			filter: `user = "${pb.authStore.record?.id}"`
		});
		const allProgress = progressResult.items;

		// 4. Group by box in memory
		const cardsByBox = new Map<string, CardsRecord[]>();
		for (const card of allCards) {
			if (!cardsByBox.has(card.box)) {
				cardsByBox.set(card.box, []);
			}
			cardsByBox.get(card.box)!.push(card);
		}

		const progressByBox = new Map<string, CardProgressRecord[]>();
		for (const progress of allProgress) {
			if (!progressByBox.has(progress.box)) {
				progressByBox.set(progress.box, []);
			}
			progressByBox.get(progress.box)!.push(progress);
		}

		// 5. Build summaries
		const boxSummaries = boxes.map((box) => {
			const cards = cardsByBox.get(box.id) ?? [];
			const progress = progressByBox.get(box.id) ?? [];

			const levelCounts = buildLevelCounts(progress, cards.length);
			const masteredCount = levelCounts[7];
			const completionPct = cards.length > 0 ? Math.round((masteredCount / cards.length) * 100) : 0;

			const reviewedIds = new Set(progress.map((p) => p.card));
			const unreviewedCount = cards.filter((c) => !reviewedIds.has(c.id)).length;
			const dueCount = unreviewedCount + progress.filter((p) => !p.mastered && isDueToday(p.next_review)).length;

			return { box, totalCards: cards.length, dueCount, completionPct };
		});

		return { boxSummaries };
	} catch (err) {
		console.error('Error loading boxes:', err);
		return { boxSummaries: [] };
	}
};
