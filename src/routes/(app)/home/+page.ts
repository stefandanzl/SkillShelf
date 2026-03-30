import { browser } from '$app/environment';
import { pb } from '$lib/pocketbase.svelte';
import { getBoxes, getCards, getProgressForBox, buildLevelCounts } from '$lib/api';
import { isDueToday } from '$lib/leitner';
import { syncLocaleFromUser } from '$lib/i18n';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
	// Skip on server - let client handle it
	if (!browser || !pb.authStore.isValid) {
		return { boxSummaries: [] };
	}

	// Sync locale from user profile
	syncLocaleFromUser();

	try {
		const boxes = await getBoxes(pb);
		console.log('Got box?', boxes);
		const boxSummaries = await Promise.all(
			boxes.map(async (box) => {
				try {
					const [cards, progress] = await Promise.all([getCards(pb, box.id), getProgressForBox(pb, box.id)]);

					const levelCounts = buildLevelCounts(progress, cards.length);
					const masteredCount = levelCounts[7];
					const completionPct = cards.length > 0 ? Math.round((masteredCount / cards.length) * 100) : 0;

					const reviewedIds = new Set(progress.map((p) => p.card));
					const unreviewedCount = cards.filter((c) => !reviewedIds.has(c.id)).length;
					const dueCount = unreviewedCount + progress.filter((p) => !p.mastered && isDueToday(p.next_review)).length;

					return { box, totalCards: cards.length, dueCount, completionPct };
				} catch (err) {
					console.error('Error loading box summary:', err);
					return { box, totalCards: 0, dueCount: 0, completionPct: 0 };
				}
			})
		);

		return { boxSummaries };
	} catch (err) {
		console.error('Error loading boxes:', err);
		return { boxSummaries: [] };
	}
};
