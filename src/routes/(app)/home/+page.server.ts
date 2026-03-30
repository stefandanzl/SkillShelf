import { redirect } from '@sveltejs/kit';
import type { Box, CardProgress } from '$lib/types';

export const load = async ({ locals }) => {
	if (!locals.user) {
		redirect(307, '/sign/in');
	}

	try {
		const pb = locals.pb;

		// Get all boxes for this user
		const boxesResult = await pb.collection('boxes').getList(1, 200, {
			filter: `owner = "${pb.authStore.record?.id}"`,
			sort: '-created'
		});

		const boxes = boxesResult.items;

		const boxSummaries = await Promise.all(
			boxes.map(async (box) => {
				try {
					// Get cards for this box
					const cardsResult = await pb.collection('cards').getList(1, 500, {
						filter: `box = "${box.id}"`,
						sort: 'sort_order,created'
					});
					const cards = cardsResult.items;

					// Get progress for this box
					const progressResult = await pb.collection('card_progress').getList(1, 500, {
						filter: `box = "${box.id}"`
					});
					const progress = progressResult.items;

					const levelCounts = buildLevelCounts(progress, cards.length);
					const masteredCount = levelCounts[7];
					const completionPct = cards.length > 0
						? Math.round((masteredCount / cards.length) * 100)
						: 0;

					// Due = unreviewed cards + cards where next_review <= now
					const reviewedIds = new Set(progress.map((p: CardProgress) => p.card));
					const unreviewedCount = cards.filter((c) => !reviewedIds.has(c.id)).length;
					const dueCount = unreviewedCount
						+ progress.filter((p: CardProgress) => !p.mastered && isDueToday(p.next_review)).length;

					return { box, totalCards: cards.length, dueCount, completionPct };
				} catch {
					return { box, totalCards: 0, dueCount: 0, completionPct: 0 };
				}
			})
		);

		return { boxSummaries };
	} catch {
		return { boxSummaries: [] };
	}
};

function buildLevelCounts(progressList: CardProgress[], totalCards: number): number[] {
	// returns array of 8: index 0-6 = levels 1-7, index 7 = mastered
	const counts = Array(8).fill(0);
	const progressMap = new Map(progressList.map((p) => [p.card, p]));

	// Cards with no progress record = level 1
	const withProgress = progressMap.size;
	counts[0] += totalCards - withProgress; // unreviewed → level 1

	for (const p of progressList) {
		if (p.mastered) {
			counts[7]++;
		} else {
			counts[p.level - 1]++;
		}
	}
	return counts;
}

function isDueToday(nextReview: string | null | undefined): boolean {
	if (!nextReview) return true;
	const now = new Date();
	const reviewDate = new Date(nextReview);
	return reviewDate <= now;
}
