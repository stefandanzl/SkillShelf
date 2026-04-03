<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    label?: string;
    icon?: Snippet;
    right?: Snippet;
    onclick?: () => void;
    danger?: boolean;
    accentBorder?: boolean;
    children?: Snippet;
  }
  let { label, icon, right, onclick, danger = false, accentBorder = false, children }: Props = $props();
</script>

<div
  class="settings-row"
  class:settings-row--clickable={!!onclick}
  class:settings-row--accent={accentBorder}
  role={onclick ? 'button' : undefined}
  tabindex={onclick ? 0 : undefined}
  onclick={onclick}
  onkeydown={onclick ? (e) => { if (e.key === 'Enter') onclick(); } : undefined}
>
  {#if icon}
    <span class="settings-row__icon" class:settings-row__icon--danger={danger}>
      {@render icon()}
    </span>
  {/if}
  <span class="settings-row__label" class:settings-row__label--danger={danger}>
    {#if children}{@render children()}{:else}{label}{/if}
  </span>
  {#if right}
    <span class="settings-row__right">
      {@render right()}
    </span>
  {/if}
</div>

<style>
  .settings-row {
    background: var(--color-surface);
    border-radius: var(--radius-md);
    padding: var(--space-sm) var(--space-md);
    min-height: 44px;
    display: flex;
    align-items: center;
    gap: var(--space-md);
  }
  .settings-row--clickable { cursor: pointer; transition: background var(--transition-fast); }
  .settings-row--clickable:hover { background: var(--color-surface-alt); }
  .settings-row--accent { border-left: 4px solid var(--color-primary); }
  .settings-row__icon { display: flex; align-items: center; flex-shrink: 0; color: var(--color-primary); }
  .settings-row__icon--danger { color: var(--color-danger); }
  .settings-row__label { flex: 1; font-size: var(--font-size-md); color: var(--color-text-primary); }
  .settings-row__label--danger { color: var(--color-danger); }
  .settings-row__right { display: flex; align-items: center; gap: var(--space-sm); flex-shrink: 0; color: var(--color-text-secondary); }
</style>
