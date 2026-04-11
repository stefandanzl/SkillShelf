import type { TypedPocketBase } from '$lib/pocketbase-types';
import type { Security } from '$lib/pocketbase.svelte';
import type { TypedAuthRecord } from '$lib/types';
// See https://kit.svelte.dev/docs/types#app
// for information about these interfaces
declare global {
	namespace App {
		interface Locals {
			pb: TypedPocketBase;
			user: TypedAuthRecord | null;
			security: Security;
		}
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}
	}
}

export {};
