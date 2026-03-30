<script lang="ts">
  import { t } from '$lib/i18n';
  import { page } from '$app/stores';
  import { goto, invalidateAll } from '$app/navigation';
  import TopBar from '$lib/components/ui/TopBar.svelte';
  import IconButton from '$lib/components/ui/IconButton.svelte';
  import ProgressBar from '$lib/components/ui/ProgressBar.svelte';
  import PillButton from '$lib/components/ui/PillButton.svelte';
  import Flashcard from '$lib/components/study/Flashcard.svelte';
  import { pb } from '$lib/pocketbase.svelte';
  import { submitAnswer } from '$lib/api';
  import type { Card, CardProgress } from '$lib/types';

  let { data } = $props();

  const boxId = $derived($page.params.id);

  // dueCards: Array<{ card: Card; progress: CardProgress | null }>
  const dueCards = $derived(data.dueCards ?? []);

  let currentIndex = $state(0);
  let flipped = $state(false);
  let showResult = $state(false);
  let done = $state(false);
  let submitting = $state(false);

  const currentEntry = $derived(dueCards[currentIndex] as { card: Card; progress: CardProgress | null } | undefined);
  const currentCard = $derived(currentEntry?.card);
  const currentProgress = $derived(currentEntry?.progress ?? null);
  const progressPct = $derived(dueCards.length > 0 ? (currentIndex / dueCards.length) * 100 : 0);
  const isLast = $derived(currentIndex >= dueCards.length - 1);

  function showAnswer() {
    flipped = true;
    showResult = true;
  }

  async function handleAnswer(wasCorrect: boolean) {
    if (!currentCard || submitting) return;
    submitting = true;
    try {
      await submitAnswer(pb as any, currentCard, currentProgress, wasCorrect);
    } catch (e) {
      console.error('Failed to submit answer', e);
    } finally {
      submitting = false;
    }
    nextCard();
  }

  function nextCard() {
    if (isLast) {
      done = true;
      return;
    }
    currentIndex += 1;
    flipped = false;
    showResult = false;
  }

  async function finishSession() {
    await invalidateAll();
    goto(`/boxes/${boxId}`);
  }

  function handleSwipeLeft() {
    if (!showResult) return;
    handleAnswer(false);
  }

  function handleSwipeRight() {
    if (!showResult) return;
    handleAnswer(true);
  }
</script>

{#if done || dueCards.length === 0}
  <div class="study study--done">
    <TopBar showBack onback={() => goto(`/boxes/${boxId}`)}>
      {#snippet center()}
        <span class="study__counter">Done!</span>
      {/snippet}
    </TopBar>
    <div class="study__done-content">
      <div class="study__done-icon">
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="var(--color-success, var(--color-primary))" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>
      <h2 class="study__done-title">
        {dueCards.length === 0 ? 'No cards due today!' : 'Session complete!'}
      </h2>
      <p class="study__done-subtitle">
        {dueCards.length === 0 ? 'All caught up.' : `You reviewed ${dueCards.length} card${dueCards.length === 1 ? '' : 's'}.`}
      </p>
      <PillButton onclick={finishSession}>Back to Box</PillButton>
    </div>
  </div>
{:else}
  <div class="study">
    <TopBar showBack onback={() => goto(`/boxes/${boxId}`)}>
      {#snippet center()}
        <span class="study__counter">
          {currentIndex + 1}/{dueCards.length}
        </span>
      {/snippet}
      {#snippet right()}
        <IconButton title="Card grid">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>
          </svg>
        </IconButton>
      {/snippet}
    </TopBar>

    <ProgressBar value={progressPct} />

    <div class="study__card-area">
      {#if currentCard}
        <Flashcard
          front={currentCard.front}
          back={currentCard.back}
          level={currentProgress?.level ?? 1}
          flipped={flipped}
          onswipeleft={handleSwipeLeft}
          onswiperight={handleSwipeRight}
        />
      {/if}
    </div>

    <div class="study__actions">
      {#if !showResult}
        <PillButton onclick={showAnswer}>
          {$t('study.show_answer')}
        </PillButton>
      {:else}
        <div class="study__result-buttons">
          <PillButton variant="danger-outline" onclick={() => handleAnswer(false)} fullWidth={false} width="calc(50% - 6px)" disabled={submitting}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
            {$t('study.incorrect')}
          </PillButton>
          <PillButton onclick={() => handleAnswer(true)} fullWidth={false} width="calc(50% - 6px)" disabled={submitting}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
            {$t('study.correct')}
          </PillButton>
        </div>
      {/if}
    </div>
  </div>
{/if}

<style>
  .study {
    display: flex;
    flex-direction: column;
    height: 100vh;
    height: 100dvh;
    overflow: hidden;
  }

  .study--done {
    overflow: auto;
  }

  .study__card-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    padding: var(--space-md);
    min-height: 0;
  }

  .study__counter {
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--color-text-primary);
  }

  .study__actions {
    padding: var(--space-md);
    padding-bottom: calc(var(--space-md) + env(safe-area-inset-bottom, 0px));
  }

  .study__result-buttons {
    display: flex;
    gap: 12px;
  }

  .study__done-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: var(--space-md);
    padding: var(--space-xl) var(--space-md);
    flex: 1;
  }

  .study__done-icon {
    width: 96px;
    height: 96px;
    border-radius: 50%;
    background: var(--color-surface);
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .study__done-title {
    font-size: var(--font-size-xl);
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0;
    text-align: center;
  }

  .study__done-subtitle {
    font-size: var(--font-size-base);
    color: var(--color-text-secondary);
    margin: 0;
    text-align: center;
  }
</style>
