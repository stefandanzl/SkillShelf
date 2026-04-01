import { browser } from '$app/environment';
import { pb } from '$lib/pocketbase.svelte';
import { getBox } from '$lib/api';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
  if (!browser) {
    return { box: null };
  }

  try {
    const box = await getBox(pb as any, params.id);
    return { box };
  } catch (err) {
    console.error('Error loading box:', err);
    error(404, 'Box not found');
  }
};
