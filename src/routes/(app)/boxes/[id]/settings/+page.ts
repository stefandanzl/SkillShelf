import { browser } from '$app/environment';
import { pb } from '$lib/pocketbase.svelte';
import { getBox, getCourses } from '$lib/api';
import { error } from '@sveltejs/kit';
import type { PageLoad } from './$types';

export const load: PageLoad = async ({ params }) => {
  if (!browser) {
    return { box: null, courses: [] };
  }

  try {
    const [box, courses] = await Promise.all([
      getBox(pb as any, params.id),
      getCourses(pb as any)
    ]);
    return { box, courses };
  } catch (err) {
    console.error('Error loading box:', err);
    error(404, 'Box not found');
  }
};
