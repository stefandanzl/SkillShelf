<script lang="ts">
  interface Props {
    front: string;
    level: number;
    lastLearned?: string;
    nextReview?: string;
    showCheckbox?: boolean;
    checked?: boolean;
    oncheck?: (v: boolean) => void;
    onclick?: () => void;
  }
  let { front, level, lastLearned, nextReview, showCheckbox = false, checked = false, oncheck, onclick }: Props = $props();
  let expanded = $state(false);

  function handleClick() {
    if (onclick) { onclick(); return; }
    if (!showCheckbox) expanded = !expanded;
  }
</script>

<div class="card-item" onclick={handleClick} role="button" tabindex="0" onkeydown={(e) => e.key === 'Enter' && handleClick()}>
  {#if showCheckbox}
    <button
      class="card-item__checkbox"
      class:card-item__checkbox--checked={checked}
      onclick={(e) => { e.stopPropagation(); oncheck?.(!checked); }}
      aria-label="Select card"
    >
      {#if checked}
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      {/if}
    </button>
  {/if}
  <div class="card-item__content">
    <span class="card-item__front">{front}</span>
    {#if expanded && !showCheckbox}
      <span class="card-item__meta">
        {#if lastLearned}Last learned: {lastLearned}{/if}
        {#if nextReview} · Next review: {nextReview} (Level {level}){/if}
      </span>
    {/if}
  </div>
  <span class="card-item__level">Lvl {level}</span>
</div>

<style>
  .card-item {
    background: var(--color-surface);
    border-radius: var(--radius-md);
    padding: var(--space-md);
    display: flex;
    align-items: center;
    gap: var(--space-md);
    cursor: pointer;
    transition: background var(--transition-fast);
  }
  .card-item:hover { background: var(--color-surface-alt); }
  .card-item__checkbox {
    width: 22px;
    height: 22px;
    border-radius: 6px;
    border: 2px solid var(--color-border);
    background: var(--color-surface-alt);
    flex-shrink: 0;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .card-item__checkbox--checked {
    background: var(--color-primary);
    border-color: var(--color-primary);
  }
  .card-item__content { flex: 1; display: flex; flex-direction: column; gap: 4px; min-width: 0; }
  .card-item__front { font-size: var(--font-size-base); color: var(--color-text-primary); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  .card-item__meta { font-size: var(--font-size-sm); color: var(--color-text-secondary); }
  .card-item__level {
    background: var(--color-surface-alt);
    border-radius: var(--radius-sm);
    padding: 2px 8px;
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    flex-shrink: 0;
  }
</style>
