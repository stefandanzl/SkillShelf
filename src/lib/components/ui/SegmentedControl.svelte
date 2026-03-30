<script lang="ts">
  interface Segment {
    value: string;
    label?: string;
    icon?: string;
  }
  interface Props {
    segments: Segment[];
    value: string;
    onchange?: (value: string) => void;
  }
  let { segments, value, onchange }: Props = $props();
</script>

<div class="segmented">
  {#each segments as seg (seg.value)}
    <button
      class="segmented__item"
      class:segmented__item--active={value === seg.value}
      onclick={() => onchange?.(seg.value)}
    >
      {#if seg.icon}<span>{seg.icon}</span>{/if}
      {#if seg.label}<span>{seg.label}</span>{/if}
    </button>
  {/each}
</div>

<style>
  .segmented {
    display: flex;
    background: var(--color-surface);
    border-radius: var(--radius-pill);
    padding: 4px;
    gap: 2px;
  }
  .segmented__item {
    flex: 1;
    height: 36px;
    border-radius: var(--radius-pill);
    font-size: var(--font-size-sm);
    font-weight: 500;
    color: var(--color-text-secondary);
    transition: background var(--transition-fast), color var(--transition-fast);
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 4px;
  }
  .segmented__item--active {
    background: var(--color-surface-alt);
    color: var(--color-text-primary);
    font-weight: 600;
  }
</style>
