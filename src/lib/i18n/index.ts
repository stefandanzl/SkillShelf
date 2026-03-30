import { browser } from '$app/environment';
import { init, register, getLocaleFromNavigator } from 'svelte-i18n';

register('en', () => import('./locales/en.json'));
register('de', () => import('./locales/de.json'));

init({
  fallbackLocale: 'en',
  initialLocale: browser ? getLocaleFromNavigator() : 'en',
});

export { t, locale } from 'svelte-i18n';
