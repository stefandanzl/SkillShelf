<script lang="ts">
  import { t } from '$lib/i18n';
  import { page } from '$app/stores';
  import { goto, invalidateAll } from '$app/navigation';
  import TopBar from '$lib/components/ui/TopBar.svelte';
  import PillButton from '$lib/components/ui/PillButton.svelte';
  import { pb } from '$lib/pocketbase.svelte';
  import { createCard } from '$lib/api';

  const boxId = $derived($page.params.id);

  let front = $state('');
  let back = $state('');
  let saving = $state(false);
  let saveError = $state('');

  const canSave = $derived(front.trim().length > 0 && back.trim().length > 0);

  async function handleSave() {
    if (!canSave || saving) return;
    saving = true;
    saveError = '';
    try {
      await createCard(pb as any, boxId, { front: front.trim(), back: back.trim() });
      await invalidateAll();
      goto(`/boxes/${boxId}`);
    } catch (e: any) {
      saveError = e?.message ?? 'Failed to save card';
      saving = false;
    }
  }
</script>

<div class="card-create">
  <TopBar
    showBack
    title={$t('card.add_title')}
    onback={() => goto(`/boxes/${boxId}`)}
  >
    {#snippet right()}
      <button
        class="save-btn"
        class:save-btn--active={canSave}
        onclick={handleSave}
        disabled={!canSave}
      >
        {$t('common.save')}
      </button>
    {/snippet}
  </TopBar>

  <div class="card-create__form">
    <div class="card-create__field">
      <label class="card-create__label" for="card-front">{$t('card.front_label')}</label>
      <textarea
        id="card-front"
        class="card-create__textarea"
        placeholder={$t('card.front_placeholder')}
        bind:value={front}
        rows={5}
      ></textarea>
    </div>

    <div class="card-create__divider">
      <div class="card-create__divider-line"></div>
      <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-secondary)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="7 10 12 15 17 10"/>
      </svg>
      <div class="card-create__divider-line"></div>
    </div>

    <div class="card-create__field">
      <label class="card-create__label" for="card-back">{$t('card.back_label')}</label>
      <textarea
        id="card-back"
        class="card-create__textarea"
        placeholder={$t('card.back_placeholder')}
        bind:value={back}
        rows={5}
      ></textarea>
    </div>

    {#if saveError}<p class="card-create__error">{saveError}</p>{/if}
    <PillButton onclick={handleSave} disabled={!canSave || saving}>
      {saving ? 'Saving…' : $t('card.add_title')}
    </PillButton>
  </div>
</div>

<style>
  .card-create {
    display: flex;
    flex-direction: column;
    min-height: 100%;
  }
  .card-create__form {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    padding: 0 var(--space-md) var(--space-xl);
  }
  .card-create__field {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }
  .card-create__label {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .card-create__textarea {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space-md);
    color: var(--color-text-primary);
    resize: vertical;
    width: 100%;
    line-height: 1.5;
  }
  .card-create__textarea:focus {
    border-color: var(--color-primary);
    outline: none;
  }
  .card-create__divider {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }
  .card-create__divider-line {
    flex: 1;
    height: 1px;
    background: var(--color-border);
  }

  .save-btn {
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--color-text-disabled);
    padding: var(--space-xs) var(--space-sm);
    transition: color var(--transition-fast);
  }
  .save-btn--active { color: var(--color-primary); }
  .save-btn:disabled { cursor: not-allowed; }
  .card-create__error { font-size: var(--font-size-sm); color: var(--color-danger); margin: 0; }
</style>
