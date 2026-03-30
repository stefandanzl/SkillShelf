import { pb } from '$lib/pocketbase.svelte';
import { getBoxes, getCards, getProgressForBox, buildLevelCounts } from '$lib/api';
import { isDueToday } from '$lib/leitner';
import type { PageLoad } from './$types';

export const load: PageLoad = async () => {
  try {
    if (!pb.authStore.isValid) return { boxSummaries: [] };

    const boxes = await getBoxes(pb);

    const boxSummaries = await Promise.all(
      boxes.map(async (box) => {
        try {
          const [cards, progress] = await Promise.all([
            getCards(pb, box.id),
            getProgressForBox(pb, box.id),
          ]);

          const levelCounts = buildLevelCounts(progress, cards.length);
          const masteredCount = levelCounts[7];
          const completionPct = cards.length > 0
            ? Math.round((masteredCount / cards.length) * 100)
            : 0;

          // Due = unreviewed cards + cards where next_review <= now
          const reviewedIds = new Set(progress.map((p) => p.card));
          const unreviewedCount = cards.filter((c) => !reviewedIds.has(c.id)).length;
          const dueCount = unreviewedCount
            + progress.filter((p) => !p.mastered && isDueToday(p.next_review)).length;

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
