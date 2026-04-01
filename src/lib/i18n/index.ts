import { browser } from '$app/environment';
import { init, register, addMessages, getLocaleFromNavigator, locale } from 'svelte-i18n';
import { pb } from '$lib/pocketbase.svelte';
import type { UsersRecord } from '$lib/pocketbase-types';

// Import fallback locale synchronously for SSR
import enMessages from './locales/en.json';

// Add fallback messages directly for SSR (synchronous)
addMessages('en', enMessages);

// Register other locales lazily (client-side only)
register('de', () => import('./locales/de.json'));

const FALLBACK_LANG = 'en';
const LOCALE_STORAGE_KEY = 'skillshelf_locale';

function getStoredLocale(): string | null {
	if (!browser) return null;
	return localStorage.getItem(LOCALE_STORAGE_KEY);
}

function setStoredLocale(lang: string) {
	if (browser) {
		localStorage.setItem(LOCALE_STORAGE_KEY, lang);
	}
}

function getUserLocale(): string | null {
	const user = pb.authStore.record as UsersRecord | null;
	return user?.language || null;
}

function getInitialLocale(): string {
	// Priority: user profile > localStorage > browser > fallback
	return getUserLocale() || getStoredLocale() || (browser ? getLocaleFromNavigator() : FALLBACK_LANG) || FALLBACK_LANG;
}

init({
	fallbackLocale: FALLBACK_LANG,
	initialLocale: getInitialLocale()
});

// Export locale setter that also persists
export function setLocale(lang: string) {
	locale.set(lang);
	setStoredLocale(lang);

	// Also update user profile if logged in
	if (browser && pb.authStore.isValid) {
		const userId = pb.authStore.record?.id;
		if (userId) {
			// Update user profile asynchronously
			pb.collection('users')
				.update(userId, { language: lang })
				.catch((err) => {
					console.error('Failed to save language preference:', err);
				});
		}
	}
}

// Export function to refresh locale from user profile (call after login)
// This runs on client-side after auth, so we can directly set the locale
export function syncLocaleFromUser() {
	if (!browser) return;

	const userLocale = getUserLocale();
	if (userLocale) {
		// Set locale without worrying about current value
		// The locale.set function will handle any necessary updates
		try {
			locale.set(userLocale);
			setStoredLocale(userLocale);
		} catch (e) {
			console.warn('Failed to sync locale:', e);
		}
	}
}

export { t, locale } from 'svelte-i18n';
