<script lang="ts">
  interface Props {
    counts?: number[];
    selected?: number[];
    onselect?: (level: number) => void;
    dangerMode?: boolean;
  }
  let { counts = Array(7).fill(0), selected = [], onselect, dangerMode = false }: Props = $props();

  const levels = [1, 2, 3, 4, 5, 6, 7];
</script>

<div class="leitner-grid">
  {#each levels as level, i (level)}
    <div class="leitner-grid__col">
      <span class="leitner-grid__count">{counts[i] ?? 0}</span>
      <button
        class="leitner-grid__btn"
        class:leitner-grid__btn--selected={selected.includes(level)}
        class:leitner-grid__btn--danger={dangerMode && selected.includes(level)}
        onclick={() => onselect?.(level)}
      >
        {level}
      </button>
    </div>
  {/each}
</div>

<style>
  .leitner-grid {
    display: grid;
    grid-template-columns: repeat(7, 1fr);
    gap: var(--space-xs);
    padding: 0 var(--space-md);
  }
  .leitner-grid__col {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-xs);
  }
  .leitner-grid__count {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    text-align: center;
  }
  .leitner-grid__btn {
    width: 44px;
    height: 44px;
    border-radius: 50%;
    background: var(--color-surface);
    color: var(--color-text-primary);
    font-size: var(--font-size-sm);
    font-weight: 600;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all var(--transition-fast);
  }
  .leitner-grid__btn--selected {
    border: 2px solid var(--color-primary);
    background: var(--color-primary-dim);
  }
  .leitner-grid__btn--danger {
    border-color: var(--color-danger);
    background: var(--color-danger-dim);
  }
  @media (max-width: 380px) {
    .leitner-grid__btn { width: 36px; height: 36px; }
  }
</style>
