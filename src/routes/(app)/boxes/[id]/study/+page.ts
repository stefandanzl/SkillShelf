import { browser } from '$app/environment';
import { pb } from '$lib/pocketbase.svelte';
import { getDueCards } from '$lib/api';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
  if (!browser) {
    return { dueCards: [], boxId: params.id };
  }

  try {
    const dueCards = await getDueCards(pb as any, params.id);
    return { dueCards, boxId: params.id };
  } catch (err) {
    console.error('Error loading due cards:', err);
    error(404, 'Box not found');
  }
};
