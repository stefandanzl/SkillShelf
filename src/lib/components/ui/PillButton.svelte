<script lang="ts">
  import type { Snippet } from 'svelte';

  interface Props {
    variant?: 'primary' | 'danger-outline' | 'danger-fill' | 'disabled' | 'practice' | 'secondary';
    fullWidth?: boolean;
    width?: string;
    onclick?: () => void;
    type?: 'button' | 'submit' | 'reset';
    disabled?: boolean;
    children?: Snippet;
  }
  let { variant = 'primary', fullWidth = true, width, onclick, type = 'button', disabled = false, children }: Props = $props();

  const isDisabled = $derived(variant === 'disabled' || disabled);
</script>

<button
  {type}
  class="pill-btn pill-btn--{variant}"
  style={width ? `width: ${width}` : fullWidth ? 'width: 100%' : ''}
  disabled={isDisabled}
  {onclick}
>
  {#if children}{@render children()}{/if}
</button>

<style>
  .pill-btn {
    border-radius: var(--radius-pill);
    height: 56px;
    font-size: var(--font-size-base);
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-sm);
    transition: opacity var(--transition-fast);
    padding: 0 var(--space-lg);
    cursor: pointer;
    border: none;
  }
  .pill-btn:hover:not(:disabled) { opacity: 0.85; }
  .pill-btn:active:not(:disabled) { opacity: 0.7; }
  .pill-btn:disabled { cursor: not-allowed; }

  .pill-btn--primary { background: var(--color-primary); color: #fff; }
  .pill-btn--secondary { background: var(--color-surface); color: var(--color-text-primary); }
  .pill-btn--danger-outline { background: transparent; border: 2px solid var(--color-danger); color: var(--color-danger); }
  .pill-btn--danger-fill { background: var(--color-danger); color: #fff; }
  .pill-btn--disabled { background: var(--color-surface-alt); color: var(--color-text-disabled); cursor: not-allowed; }
  .pill-btn--practice { background: transparent; border: 2px solid var(--color-danger); color: var(--color-danger); }
</style>
