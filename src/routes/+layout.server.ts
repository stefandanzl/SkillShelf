import { waitLocale } from 'svelte-i18n';

export const load = async ({ locals }) => {
	// await waitLocale();
	const results = { user: locals.user ?? null };
	return results;
};
