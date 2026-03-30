import { error, redirect } from '@sveltejs/kit';
import type { CardProgress } from '$lib/types';

export const load = async ({ locals, params }) => {
	if (!locals.user) {
		redirect(307, '/sign/in');
	}

	const pb = locals.pb;

	try {
		// Get the box
		const box = await pb.collection('boxes').getOne(params.id);

		// Check if user owns this box
		if (box.owner !== pb.authStore.record?.id) {
			error(403, 'You do not have access to this box');
		}

		// Get cards for this box
		const cardsResult = await pb.collection('cards').getList(1, 500, {
			filter: `box = "${params.id}"`,
			sort: 'sort_order,created'
		});
		const cards = cardsResult.items;

		// Get progress for this box
		const progressResult = await pb.collection('card_progress').getList(1, 500, {
			filter: `box = "${params.id}"`
		});
		const progress = progressResult.items;

		const levelCounts = buildLevelCounts(progress, cards.length);

		const reviewedIds = new Set(progress.map((p) => p.card));
		const progressMap = new Map(progress.map((p) => [p.card, p]));

		const dueCount = cards.filter((c) => {
			if (!reviewedIds.has(c.id)) return true; // unreviewed = due
			const p = progressMap.get(c.id);
			return p && !p.mastered && isDueToday(p.next_review);
		}).length;

		return { box, cards, progress, levelCounts, dueCount, progressMap: Object.fromEntries(progressMap) };
	} catch (e) {
		error(404, 'Box not found');
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
