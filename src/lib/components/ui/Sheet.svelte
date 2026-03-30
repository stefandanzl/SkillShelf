<script lang="ts">
  import type { Snippet } from 'svelte';
  interface Props {
    open: boolean;
    title?: string;
    onclose?: () => void;
    onconfirm?: () => void;
    showConfirm?: boolean;
    children: Snippet;
  }
  let { open, title, onclose, onconfirm, showConfirm = false, children }: Props = $props();
</script>

{#if open}
  <div class="sheet-scrim" onclick={onclose} role="presentation"></div>
  <div class="sheet" role="dialog" aria-modal="true">
    <div class="sheet__header">
      <button class="sheet__close" onclick={onclose} aria-label="Close">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
      {#if title}<span class="sheet__title">{title}</span>{/if}
      {#if showConfirm && onconfirm}
        <button class="sheet__confirm" onclick={onconfirm} aria-label="Confirm">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </button>
      {:else}
        <div style="width: 40px;"></div>
      {/if}
    </div>
    <div class="sheet__body">
      {@render children()}
    </div>
  </div>
{/if}

<style>
  .sheet-scrim {
    position: fixed;
    inset: 0;
    background: var(--color-overlay);
    z-index: 100;
    animation: fadeIn var(--transition-base) ease;
  }
  .sheet {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    background: var(--color-surface);
    border-radius: var(--radius-lg) var(--radius-lg) 0 0;
    z-index: 101;
    max-height: 90vh;
    overflow-y: auto;
    animation: slideUp var(--transition-base) ease;
  }
  @media (min-width: 768px) {
    .sheet {
      top: 50%;
      left: 50%;
      right: auto;
      bottom: auto;
      transform: translate(-50%, -50%);
      border-radius: var(--radius-lg);
      width: min(90vw, 480px);
      max-height: 80vh;
      animation: fadeIn var(--transition-base) ease;
    }
  }
  .sheet__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-md);
    border-bottom: 1px solid var(--color-border);
    position: sticky;
    top: 0;
    background: var(--color-surface);
    z-index: 1;
  }
  .sheet__title {
    font-size: var(--font-size-md);
    font-weight: 600;
    color: var(--color-text-primary);
  }
  .sheet__close {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--color-surface-alt);
    color: var(--color-text-secondary);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .sheet__confirm {
    width: 40px;
    height: 40px;
    border-radius: 50%;
    background: var(--color-primary);
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .sheet__body {
    padding: var(--space-md);
  }
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes slideUp {
    from { transform: translateY(100%); }
    to { transform: translateY(0); }
  }
</style>
