<script lang="ts">
  import { t } from '$lib/i18n';
  import { page } from '$app/stores';
  import { goto, invalidateAll } from '$app/navigation';
  import TopBar from '$lib/components/ui/TopBar.svelte';
  import PillButton from '$lib/components/ui/PillButton.svelte';
  import { pb } from '$lib/pocketbase.svelte';
  import { createCard } from '$lib/api';
  import { marked } from 'marked';

  const boxId = $derived($page.params.id);

  // Load user markdown setting
  interface UserSettings {
    enableMarkdown?: boolean;
  }
  const user = $derived(pb.authStore.record as any);
  const enableMarkdown = $derived((user?.settings as UserSettings)?.enableMarkdown ?? true);

  // Configure marked
  marked.use({
    gfm: true,
    breaks: true
  });

  let front = $state('');
  let back = $state('');
  let saving = $state(false);
  let saveError = $state('');

  const canSave = $derived(front.trim().length > 0 && back.trim().length > 0);
  const renderedFront = $derived(enableMarkdown ? marked(front) : front);
  const renderedBack = $derived(enableMarkdown ? marked(back) : back);

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
      {#if enableMarkdown}
        <div class="card-create__preview">
          <div class="card-create__preview-label">Preview</div>
          <div class="card-create__preview-content">{@html renderedFront}</div>
        </div>
      {/if}
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
      {#if enableMarkdown}
        <div class="card-create__preview">
          <div class="card-create__preview-label">Preview</div>
          <div class="card-create__preview-content">{@html renderedBack}</div>
        </div>
      {/if}
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
  .card-create__preview {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space-md);
    margin-top: var(--space-xs);
  }
  .card-create__preview-label {
    font-size: var(--font-size-xs);
    font-weight: 600;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin-bottom: var(--space-xs);
  }
  .card-create__preview-content {
    font-size: var(--font-size-md);
    color: var(--color-text-primary);
    line-height: 1.5;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 80px;
  }
  /* Markdown styles */
  .card-create__preview-content :global(p) {
    margin: 0.5em 0;
  }
  .card-create__preview-content :global(code) {
    background: var(--color-surface-alt);
    padding: 0.2em 0.4em;
    border-radius: 4px;
    font-family: monospace;
    font-size: 0.9em;
  }
  .card-create__preview-content :global(pre) {
    background: var(--color-surface-alt);
    padding: var(--space-sm);
    border-radius: var(--radius-sm);
    overflow-x: auto;
    text-align: left;
  }
  .card-create__preview-content :global(pre code) {
    background: none;
    padding: 0;
  }
  .card-create__preview-content :global(strong) {
    font-weight: 700;
  }
  .card-create__preview-content :global(em) {
    font-style: italic;
  }
  .card-create__preview-content :global(ul),
  .card-create__preview-content :global(ol) {
    text-align: left;
    padding-left: var(--space-lg);
  }
  .card-create__preview-content :global(li) {
    margin: 0.3em 0;
  }
  .card-create__preview-content :global(blockquote) {
    border-left: 3px solid var(--color-border);
    padding-left: var(--space-sm);
    color: var(--color-text-secondary);
    font-style: italic;
  }
  .card-create__preview-content :global(h1),
  .card-create__preview-content :global(h2),
  .card-create__preview-content :global(h3),
  .card-create__preview-content :global(h4),
  .card-create__preview-content :global(h5),
  .card-create__preview-content :global(h6) {
    font-weight: 700;
    margin: 0.5em 0;
    text-align: center;
  }
  .card-create__preview-content :global(a) {
    color: var(--color-primary);
    text-decoration: underline;
  }
  .card-create__preview-content :global(img) {
    max-width: 100%;
    display: block;
    margin: var(--space-xs) auto;
    pointer-events: none;
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
