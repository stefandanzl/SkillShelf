<script lang="ts">
  import type { Snippet } from 'svelte';
  import IconButton from './IconButton.svelte';

  interface Props {
    showBack?: boolean;
    title?: string;
    center?: Snippet;
    right?: Snippet;
    onback?: () => void;
  }
  let { showBack = false, title, center, right, onback }: Props = $props();

  function handleBack() {
    if (onback) onback();
    else history.back();
  }
</script>

<header class="top-bar">
  <div class="top-bar__left">
    {#if showBack}
      <IconButton onclick={handleBack} title="Back">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="15 18 9 12 15 6"/>
        </svg>
      </IconButton>
    {/if}
  </div>

  <div class="top-bar__center">
    {#if center}
      {@render center()}
    {:else if title}
      <span class="top-bar__title">{title}</span>
    {/if}
  </div>

  <div class="top-bar__right">
    {#if right}{@render right()}{/if}
  </div>
</header>

<style>
  .top-bar {
    height: var(--top-bar-height);
    padding: 0 var(--space-md);
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-shrink: 0;
  }
  .top-bar__left,
  .top-bar__right {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    min-width: 48px;
  }
  .top-bar__right { justify-content: flex-end; }
  .top-bar__center {
    flex: 1;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .top-bar__title {
    font-size: var(--font-size-lg);
    font-weight: 600;
    color: var(--color-text-primary);
  }
</style>
