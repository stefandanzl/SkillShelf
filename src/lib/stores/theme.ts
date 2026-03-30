import { browser } from '$app/environment';
import { writable } from 'svelte/store';

export type Theme = 'auto' | 'light' | 'dark';

function createThemeStore() {
  const initial: Theme = browser
    ? (localStorage.getItem('theme') as Theme) ?? 'auto'
    : 'auto';

  const { subscribe, set } = writable<Theme>(initial);

  function applyTheme(theme: Theme) {
    if (!browser) return;
    const root = document.documentElement;
    if (theme === 'dark') {
      root.setAttribute('data-theme', 'dark');
    } else if (theme === 'light') {
      root.setAttribute('data-theme', 'light');
    } else {
      root.removeAttribute('data-theme');
    }
    localStorage.setItem('theme', theme);
  }

  if (browser) applyTheme(initial);

  return {
    subscribe,
    set(theme: Theme) {
      set(theme);
      applyTheme(theme);
    },
  };
}

export const theme = createThemeStore();
