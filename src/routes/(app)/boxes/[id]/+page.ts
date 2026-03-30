import { pb } from '$lib/pocketbase.svelte';
import { getBox, getCards, getProgressForBox, buildLevelCounts } from '$lib/api';
import { isDueToday } from '$lib/leitner';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
  try {
    const [box, cards, progress] = await Promise.all([
      getBox(pb as any, params.id),
      getCards(pb as any, params.id),
      getProgressForBox(pb as any, params.id),
    ]);

    const levelCounts = buildLevelCounts(progress, cards.length);

    const reviewedIds = new Set(progress.map((p) => p.card));
    const progressMap = new Map(progress.map((p) => [p.card, p]));

    const dueCount = cards.filter((c) => {
      if (!reviewedIds.has(c.id)) return true; // unreviewed = due
      const p = progressMap.get(c.id);
      return p && !p.mastered && isDueToday(p.next_review);
    }).length;

    return { box, cards, progress, levelCounts, dueCount, progressMap: Object.fromEntries(progressMap) };
  } catch (e: any) {
    error(404, 'Box not found');
  }
};
