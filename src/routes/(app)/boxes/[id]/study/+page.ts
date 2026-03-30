import { pb } from '$lib/pocketbase.svelte';
import { getDueCards } from '$lib/api';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
  try {
    const dueCards = await getDueCards(pb as any, params.id);
    return { dueCards, boxId: params.id };
  } catch (e: any) {
    error(404, 'Box not found');
  }
};
