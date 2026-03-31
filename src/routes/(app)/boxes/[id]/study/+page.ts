import { browser } from '$app/environment';
import { pb } from '$lib/pocketbase.svelte';
import { getCards, getProgressForBox } from '$lib/api';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params, url }) => {
	if (!browser) {
		return { dueCards: [], boxId: params.id };
	}

	try {
		// Get selected levels from URL query param
		const levelsParam = url.searchParams.get('levels');
		const selectedLevels = levelsParam ? levelsParam.split(',').map(Number) : [];

		// Get all cards and progress
		const [cards, progress] = await Promise.all([
			getCards(pb as any, params.id),
			getProgressForBox(pb as any, params.id),
		]);

		const progressMap = new Map(progress.map((p) => [p.card, p]));

		// Filter cards by selected levels
		const filteredCards = cards
			.map((card) => ({
				card,
				progress: progressMap.get(card.id) ?? null,
			}))
			.filter(({ progress }) => {
				// If no levels selected, include all cards
				if (selectedLevels.length === 0) return true;
				// Otherwise, check if card's level is in selected levels
				const cardLevel = progress?.level ?? 1;
				return selectedLevels.includes(cardLevel);
			});

		return { dueCards: filteredCards, boxId: params.id, selectedLevels };
	} catch (err) {
		console.error('Error loading study cards:', err);
		error(404, 'Box not found');
	}
};
