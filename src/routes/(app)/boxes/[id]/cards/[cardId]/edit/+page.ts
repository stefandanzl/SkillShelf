import { browser } from '$app/environment';
import { pb } from '$lib/pocketbase.svelte';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
  if (!browser) {
    return { card: null, progress: null };
  }

  try {
    const card = await (pb as any).collection('cards').getOne(params.cardId);
    const progressList = await (pb as any).collection('card_progress').getList(1, 1, {
      filter: `card = "${params.cardId}"`,
    });
    const progress = progressList.items[0] ?? null;
    return { card, progress };
  } catch {
    error(404, 'Card not found');
  }
};
