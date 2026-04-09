import { browser } from '$app/environment';
import { pb } from '$lib/pocketbase.svelte';
import { getBoxes, getCourses, buildLevelCounts } from '$lib/api';
import { isDueToday } from '$lib/leitner';
import type { PageLoad } from './$types';
import type { CardsRecord, CardProgressRecord } from '$lib/pocketbase-types';

export const load: PageLoad = async () => {
	// Skip on server - let client handle it
	if (!browser) {
		return { boxSummaries: [], courses: [] };
	}

	if (!pb.authStore.isValid) {
		return { boxSummaries: [], courses: [] };
	}

	try {
		// 1. Get all boxes and courses for this user in parallel
		const [boxes, courses] = await Promise.all([getBoxes(pb), getCourses(pb)]);

		if (boxes.length === 0) {
			return { boxSummaries: [], courses };
		}

		// 2. Get ALL cards for user's boxes in ONE request
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

			const { levels: levelCounts } = buildLevelCounts(progress, cards.length);
			const masteredCount = levelCounts[6];
			const completionPct = cards.length > 0 ? Math.round((masteredCount / cards.length) * 100) : 0;

			const reviewedIds = new Set(progress.map((p) => p.card));
			const unreviewedCount = cards.filter((c) => !reviewedIds.has(c.id)).length;
			const dueCount = unreviewedCount + progress.filter((p) => !p.mastered && isDueToday(p.next_review)).length;

			return { box, totalCards: cards.length, dueCount, completionPct };
		});

		return { boxSummaries, courses };
	} catch (err) {
		console.error('Error loading boxes:', err);
		return { boxSummaries: [], courses: [] };
	}
};
