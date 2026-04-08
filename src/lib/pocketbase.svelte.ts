import type { TypedPocketBase, UsersRecord } from './pocketbase-types';
import type { ClientResponseError } from 'pocketbase';
import { redirect, error, type RequestEvent } from '@sveltejs/kit';
import PocketBase from 'pocketbase';
import { browser, dev } from '$app/environment';
import { env } from '$env/dynamic/public';

function createPocketBase(): TypedPocketBase {
	const instance = new PocketBase(env.PUBLIC_POCKETBASE_URL) as TypedPocketBase;

	if (browser) {
		instance.authStore.onChange(() => {
			document.cookie = instance.authStore.exportToCookie({
				httpOnly: false,
				sameSite: 'Lax',
				secure: !dev
			});
		});
	}

	return instance;
}

export function syncAuthFromCookie(): Promise<void> {
	if (!browser) return Promise.resolve();
	pb.authStore.loadFromCookie(document.cookie); // reads current cookie
	if (!pb.authStore.isValid) return Promise.resolve();
	return pb
		.collection('users')
		.authRefresh()
		.then(() => {})
		.catch(() => pb.authStore.clear());
}

// CSR only — import only from .svelte files or other .svelte.ts modules
export const pb = $state(createPocketBase());

export const getAvatarUrl = (user: UsersRecord | null | undefined): string | null => {
	if (!user?.avatar) return null;
	return pb.files.getURL(user, user.avatar);
};

export const pbError = (e: unknown): never => {
	const err = e as ClientResponseError;
	if (dev) console.error(err?.response);
	error(err?.status ?? 500, err?.response?.message ?? 'Unknown error');
};

export class Security {
	private readonly user: UsersRecord | null;

	constructor(private readonly event: RequestEvent) {
		this.user = event.locals.user ?? null;
	}

	isAuthenticated(): this {
		if (!this.user) error(401, 'You are not signed in.');
		if (!this.user.verified) redirect(307, '/verify');
		return this;
	}

	isAdmin(): this {
		this.isAuthenticated();
		if (!this.user?.admin) error(403, 'Your account is not an administrator.');
		return this;
	}
}
