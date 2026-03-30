<script lang="ts">
  import '../app.css';
  import { page } from '$app/stores';
  import { t } from '$lib/i18n';
  import { onMount } from 'svelte';
  import { waitLocale } from 'svelte-i18n';
  import { browser } from '$app/environment';
  import { theme } from '$lib/stores/theme';
  import { initHotkeys } from '$lib/hotkeys';
  // subscribing ensures the store initializes and applies the theme
  theme.subscribe(() => {});

  let { children, data } = $props();

  const navItems = [
    { href: '/home', icon: 'home', key: 'nav.home' },
    { href: '/profile', icon: 'user', key: 'nav.profile' },
    { href: '/settings', icon: 'settings', key: 'nav.settings' },
  ];

  const currentPath = $derived($page.url.pathname);
  const isAppRoute = $derived(
    currentPath.startsWith('/home') ||
    currentPath.startsWith('/boxes') ||
    currentPath.startsWith('/profile') ||
    currentPath.startsWith('/settings')
  );

  let isReady = $state(!browser);

  onMount(async () => {
    await waitLocale();
    initHotkeys();
    isReady = true;
  });
</script>

{#if isReady}
  {#if isAppRoute}
    <div class="app-shell">
      <!-- Desktop sidebar -->
      <nav class="sidebar-nav">
        <div class="sidebar-nav__logo">
          <span class="sidebar-nav__logo-icon">🧠</span>
          <span class="sidebar-nav__logo-name">{$t('common.app_name')}</span>
        </div>
        {#each navItems as item (item.href)}
          <a
            href={item.href}
            class="sidebar-nav__item"
            class:sidebar-nav__item--active={currentPath.startsWith(item.href)}
          >
            {#if item.icon === 'home'}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            {:else if item.icon === 'user'}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            {:else if item.icon === 'settings'}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M4.93 19.07l1.41-1.41M19.07 19.07l-1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>
            {/if}
            <span>{$t(item.key)}</span>
          </a>
        {/each}
        <div class="sidebar-nav__spacer"></div>
        {#if data.user}
          <div class="sidebar-nav__user">
            <div class="sidebar-nav__avatar">{(data.user.name || data.user.email || '?')[0].toUpperCase()}</div>
            <span>{data.user.name || data.user.email}</span>
          </div>
        {/if}
      </nav>

      <!-- Main content -->
      <main class="page-content">
        {@render children()}
      </main>

      <!-- Mobile bottom nav -->
      <nav class="bottom-nav">
        {#each navItems as item (item.href)}
          <a
            href={item.href}
            class="bottom-nav__item"
            class:bottom-nav__item--active={currentPath.startsWith(item.href)}
          >
            {#if item.icon === 'home'}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>
            {:else if item.icon === 'user'}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
            {:else if item.icon === 'settings'}
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41M4.93 19.07l1.41-1.41M19.07 19.07l-1.41-1.41M12 2v2M12 20v2M2 12h2M20 12h2"/></svg>
            {/if}
            <span class="bottom-nav__label">{$t(item.key)}</span>
          </a>
        {/each}
      </nav>
    </div>
  {:else}
    {@render children()}
  {/if}
{:else}
  <div class="loading-screen"></div>
{/if}

<style>
  .app-shell {
    display: flex;
    flex-direction: column;
    min-height: 100vh;
    min-height: 100dvh;
    position: relative;
  }

  .page-content {
    flex: 1;
    overflow-y: auto;
    padding-bottom: calc(var(--bottom-nav-height) + var(--space-md));
  }

  /* Mobile Bottom Nav */
  .bottom-nav {
    position: fixed;
    bottom: var(--space-sm);
    left: var(--space-sm);
    right: var(--space-sm);
    height: var(--bottom-nav-height);
    background: var(--color-surface);
    border-radius: var(--radius-pill);
    display: flex;
    align-items: center;
    z-index: 50;
    box-shadow: var(--shadow-card);
  }
  .bottom-nav__item {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 4px;
    color: var(--color-text-secondary);
    text-decoration: none;
    padding: var(--space-xs);
    transition: color var(--transition-fast);
  }
  .bottom-nav__item--active {
    color: var(--color-primary);
  }
  .bottom-nav__label {
    font-size: var(--font-size-xs);
    font-weight: 500;
  }

  /* Desktop Sidebar */
  .sidebar-nav { display: none; }

  @media (min-width: 768px) {
    .app-shell {
      flex-direction: row;
    }
    .sidebar-nav {
      display: flex;
      flex-direction: column;
      width: var(--desktop-sidebar-w);
      background: var(--color-surface);
      border-right: 1px solid var(--color-border);
      height: 100vh;
      position: sticky;
      top: 0;
      padding: var(--space-lg) var(--space-md);
      gap: var(--space-xs);
      flex-shrink: 0;
    }
    .sidebar-nav__logo {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      padding: var(--space-sm) var(--space-sm) var(--space-lg);
      font-size: var(--font-size-md);
      font-weight: 700;
      color: var(--color-text-primary);
    }
    .sidebar-nav__logo-icon { font-size: 24px; }
    .sidebar-nav__item {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      padding: var(--space-sm) var(--space-sm);
      border-radius: var(--radius-md);
      color: var(--color-text-secondary);
      text-decoration: none;
      font-size: var(--font-size-base);
      transition: all var(--transition-fast);
    }
    .sidebar-nav__item:hover { background: var(--color-surface-alt); color: var(--color-text-primary); }
    .sidebar-nav__item--active { color: var(--color-primary); background: var(--color-primary-dim); }
    .sidebar-nav__spacer { flex: 1; }
    .sidebar-nav__user {
      display: flex;
      align-items: center;
      gap: var(--space-sm);
      padding: var(--space-sm);
      font-size: var(--font-size-sm);
      color: var(--color-text-secondary);
    }
    .sidebar-nav__avatar {
      width: 32px; height: 32px;
      border-radius: 50%;
      background: var(--color-primary);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 700;
      font-size: var(--font-size-sm);
    }
    .bottom-nav { display: none; }
    .page-content {
      flex: 1;
      max-width: var(--content-max-width);
      margin: 0 auto;
      padding: var(--space-xl) var(--space-md) var(--space-md);
    }
  }

  .loading-screen {
    min-height: 100vh;
    background: var(--color-bg);
  }
</style>
