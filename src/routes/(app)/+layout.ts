import { syncAuthFromCookie } from '$lib/pocketbase.svelte';

export const load = async ({ parent }) => {
	await syncAuthFromCookie();
	return await parent();
};
