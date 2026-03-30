import type { TypedPocketBase, Box, Card, CardProgress, BoxColor, LearnDirection } from './types';
import { processAnswer } from './leitner';

// ── Boxes ─────────────────────────────────────────────────────────────────────

export async function getBoxes(pb: TypedPocketBase): Promise<Box[]> {
  const result = await pb.collection('boxes').getList(1, 200, {
    sort: '-created',
  });
  return result.items;
}

export async function getBox(pb: TypedPocketBase, id: string): Promise<Box> {
  return pb.collection('boxes').getOne(id);
}

export async function createBox(
  pb: TypedPocketBase,
  data: { name: string; color: BoxColor; learn_direction?: LearnDirection; tts_language?: string }
): Promise<Box> {
  return pb.collection('boxes').create({
    name: data.name,
    owner: pb.authStore.record?.id,
    color: data.color,
    learn_direction: data.learn_direction ?? 'front_to_back',
    tts_language: data.tts_language ?? '',
  });
}

export async function updateBox(
  pb: TypedPocketBase,
  id: string,
  data: Partial<Pick<Box, 'name' | 'color' | 'learn_direction' | 'tts_language'>>
): Promise<Box> {
  return pb.collection('boxes').update(id, data);
}

export async function deleteBox(pb: TypedPocketBase, id: string): Promise<void> {
  await pb.collection('boxes').delete(id);
}

// ── Cards ─────────────────────────────────────────────────────────────────────

export async function getCards(pb: TypedPocketBase, boxId: string): Promise<Card[]> {
  const result = await pb.collection('cards').getList(1, 500, {
    filter: `box = "${boxId}"`,
    sort: 'sort_order,created',
  });
  return result.items;
}

export async function createCard(
  pb: TypedPocketBase,
  boxId: string,
  data: { front: string; back: string }
): Promise<Card> {
  return pb.collection('cards').create({
    box: boxId,
    front: data.front,
    back: data.back,
    sort_order: Date.now(),
  });
}

export async function updateCard(
  pb: TypedPocketBase,
  id: string,
  data: { front?: string; back?: string }
): Promise<Card> {
  return pb.collection('cards').update(id, data);
}

export async function deleteCard(pb: TypedPocketBase, id: string): Promise<void> {
  await pb.collection('cards').delete(id);
}

// ── Card Progress ─────────────────────────────────────────────────────────────

export async function getProgressForBox(
  pb: TypedPocketBase,
  boxId: string
): Promise<CardProgress[]> {
  const result = await pb.collection('card_progress').getList(1, 500, {
    filter: `box = "${boxId}"`,
  });
  return result.items;
}

export async function getDueCards(
  pb: TypedPocketBase,
  boxId: string
): Promise<Array<{ card: Card; progress: CardProgress | null }>> {
  // Get all cards in box
  const cards = await getCards(pb, boxId);

  // Get all progress records for this box
  const progressList = await getProgressForBox(pb, boxId);
  const progressMap = new Map(progressList.map((p) => [p.card, p]));

  const now = new Date();
  const result: Array<{ card: Card; progress: CardProgress | null }> = [];

  for (const card of cards) {
    const progress = progressMap.get(card.id) ?? null;
    // No progress = never reviewed = always due
    if (!progress) {
      result.push({ card, progress: null });
      continue;
    }
    if (!progress.mastered) {
      const nextReview = progress.next_review ? new Date(progress.next_review) : null;
      if (!nextReview || nextReview <= now) {
        result.push({ card, progress });
      }
    }
  }

  return result;
}

export async function submitAnswer(
  pb: TypedPocketBase,
  card: Card,
  existingProgress: CardProgress | null,
  wasCorrect: boolean
): Promise<CardProgress> {
  const userId = pb.authStore.record?.id;
  if (!userId) throw new Error('Not authenticated');

  const current = existingProgress ?? { level: 1, streak: 0 };
  const update = processAnswer(current as CardProgress, wasCorrect);

  if (existingProgress) {
    return pb.collection('card_progress').update(existingProgress.id, update);
  } else {
    return pb.collection('card_progress').create({
      user: userId,
      card: card.id,
      box: card.box,
      level: update.level,
      mastered: update.mastered,
      last_reviewed: update.last_reviewed,
      next_review: update.next_review,
      streak: update.streak,
    });
  }
}

// ── Level counts (for Leitner grid) ──────────────────────────────────────────

export function buildLevelCounts(progressList: CardProgress[], totalCards: number): number[] {
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
