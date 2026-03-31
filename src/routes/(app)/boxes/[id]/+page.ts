import { browser } from '$app/environment';
import { pb } from '$lib/pocketbase.svelte';
import { getBox, getCards, getProgressForBox, buildLevelCounts } from '$lib/api';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
  if (!browser) {
    // Return minimal data on server, will load on client
    return { box: null, cards: [], progress: [], levelCounts: [], dueCount: 0, progressMap: {} };
  }

  try {
    const [box, cards, progress] = await Promise.all([
      getBox(pb as any, params.id),
      getCards(pb as any, params.id),
      getProgressForBox(pb as any, params.id),
    ]);

    const { levels: levelCounts, starred: starredCount } = buildLevelCounts(progress, cards.length);
    const progressMap = new Map(progress.map((p) => [p.card, p]));

    // All cards are always available - no spaced repetition
    const dueCount = cards.length;

    return { box, cards, progress, levelCounts, starredCount, dueCount, progressMap: Object.fromEntries(progressMap) };
  } catch (err) {
    console.error('Error loading box:', err);
    error(404, 'Box not found');
  }
};
