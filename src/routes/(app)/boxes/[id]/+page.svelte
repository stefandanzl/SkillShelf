<script lang="ts">
  import { t } from '$lib/i18n';
  import { page } from '$app/stores';
  import { goto, invalidateAll } from '$app/navigation';
  import TopBar from '$lib/components/ui/TopBar.svelte';
  import IconButton from '$lib/components/ui/IconButton.svelte';
  import CircularProgress from '$lib/components/ui/CircularProgress.svelte';
  import PillButton from '$lib/components/ui/PillButton.svelte';
  import LeitnerGrid from '$lib/components/ui/LeitnerGrid.svelte';
  import CardItem from '$lib/components/ui/CardItem.svelte';
  import Sheet from '$lib/components/ui/Sheet.svelte';
  import SegmentedControl from '$lib/components/ui/SegmentedControl.svelte';
  import { pb } from '$lib/pocketbase.svelte';
  import { deleteBox } from '$lib/api';
  import { BOX_COLOR_MAP } from '$lib/leitner';
	import type { CardsRecord } from '$lib/pocketbase-types.js';

  let { data } = $props();

  const boxId = $derived($page.params.id);

  const box = $derived(data.box);
  const cards = $derived(data.cards ?? []);
  const levelCounts = $derived(data.levelCounts ?? Array(8).fill(0));
  const dueCount = $derived(data.dueCount ?? 0);
  const progressMap = $derived(data.progressMap ?? {});

  const boxColor = $derived(BOX_COLOR_MAP[box?.color ?? ''] ?? 'var(--color-primary)');
  const totalCards = $derived(cards.length);
  const masteredCount = $derived(levelCounts[7] ?? 0);
  const completionPct = $derived(totalCards > 0 ? Math.round((masteredCount / totalCards) * 100) : 0);

  let showMenu = $state(false);
  let showSearch = $state(false);
  let searchQuery = $state('');
  let selectedLevels = $state<number[]>([]);
  let currentPage = $state(0);
  let deleting = $state(false);

  const filteredCards = $derived(
    cards.filter((c: CardsRecord) => {
      const matchSearch = !searchQuery || c.front.toLowerCase().includes(searchQuery.toLowerCase());
      const matchLevel = selectedLevels.length === 0 || selectedLevels.includes((progressMap[c.id]?.level ?? 1));
      return matchSearch && matchLevel;
    })
  );

  function toggleLevel(level: number) {
    if (selectedLevels.includes(level)) {
      selectedLevels = selectedLevels.filter(l => l !== level);
    } else {
      selectedLevels = [...selectedLevels, level];
    }
  }

  async function handleDelete() {
    if (!confirm('Delete this box and all its cards?')) return;
    deleting = true;
    try {
      await deleteBox(pb as any, boxId);
      goto('/home');
    } catch (e: any) {
      alert(e?.message ?? 'Failed to delete box');
      deleting = false;
    }
  }
</script>

<div class="box-detail">
  <TopBar showBack onback={() => goto('/home')}>
    {#snippet center()}
      <div class="box-detail__topbar-center">
        <CircularProgress value={completionPct} size={36} color={boxColor} />
        <span class="box-detail__card-count">{totalCards} cards</span>
      </div>
    {/snippet}
    {#snippet right()}
      <IconButton onclick={() => goto(`/boxes/${boxId}/cards/create`)} title="Add card">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
      </IconButton>
      <IconButton onclick={() => showMenu = true} title="More options">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/>
        </svg>
      </IconButton>
    {/snippet}
  </TopBar>

  <!-- Box title -->
  <div class="box-detail__title-section">
    <div class="box-detail__accent" style="background: {boxColor}"></div>
    <h1 class="box-detail__title">{box?.name ?? ''}</h1>
  </div>

  <!-- Leitner Grid -->
  <LeitnerGrid
    counts={levelCounts}
    selected={selectedLevels}
    onselect={toggleLevel}
  />

  <!-- Page dots -->
  <div class="box-detail__dots">
    <button class="box-detail__dot" class:box-detail__dot--active={currentPage === 0} onclick={() => currentPage = 0}></button>
    <button class="box-detail__dot" class:box-detail__dot--active={currentPage === 1} onclick={() => currentPage = 1}></button>
  </div>

  <!-- Learn/Create button -->
  <div class="box-detail__actions">
    {#if totalCards === 0}
      <PillButton
        variant="primary"
        onclick={() => goto(`/boxes/${boxId}/cards/create`)}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
        </svg>
        Add Cards
      </PillButton>
    {:else}
      <PillButton
        variant={dueCount === 0 ? 'disabled' : 'primary'}
        onclick={() => {
          const levelsParam = selectedLevels.length > 0
            ? `?levels=${selectedLevels.join(',')}`
            : '';
          goto(`/boxes/${boxId}/study${levelsParam}`);
        }}
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>
        {$t('box.learn_button')}
      </PillButton>
    {/if}
  </div>

  <!-- Search & Select Section -->
  <div class="box-detail__section">
    <button
      class="box-detail__section-header"
      onclick={() => showSearch = !showSearch}
    >
      <span class="box-detail__section-title">{$t('box.search_section')}</span>
      <svg
        width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"
        style="transform: rotate({showSearch ? 180 : 0}deg); transition: transform var(--transition-fast)"
      >
        <polyline points="6 9 12 15 18 9"/>
      </svg>
    </button>
    {#if showSearch}
      <div class="box-detail__search">
        <div class="box-detail__search-input-wrap">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            class="box-detail__search-input"
            type="text"
            placeholder="Search cards..."
            bind:value={searchQuery}
          />
        </div>
        <p class="box-detail__cards-found">{filteredCards.length} {$t('box.cards_found')}</p>
      </div>
    {/if}
  </div>

  <!-- Card list -->
  <div class="box-detail__cards">
    {#each filteredCards as card (card.id)}
      <CardItem
        front={card.front}
        level={progressMap[card.id]?.level ?? 1}
        lastLearned={progressMap[card.id]?.last_reviewed ?? ''}
        nextReview={progressMap[card.id]?.next_review ?? ''}
        onclick={() => goto(`/boxes/${boxId}/cards/${card.id}/edit`)}
      />
    {/each}
  </div>
</div>

<!-- Box menu sheet -->
<Sheet open={showMenu} title={$t('box.settings_title')} onclose={() => showMenu = false}>
  {#snippet children()}
    <div class="box-menu">
      <button class="box-menu__item" onclick={() => { showMenu = false; goto(`/boxes/${boxId}/settings`); }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.07 4.93l-1.41 1.41M4.93 4.93l1.41 1.41"/></svg>
        <span>{$t('box.settings_title')}</span>
      </button>
      <button class="box-menu__item" onclick={() => showMenu = false}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
        <span>{$t('box.export')}</span>
      </button>
      <button class="box-menu__item box-menu__item--danger" onclick={() => { showMenu = false; handleDelete(); }} disabled={deleting}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/></svg>
        <span>{$t('box.delete')}</span>
      </button>
    </div>
  {/snippet}
</Sheet>

<style>
  .box-detail {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    padding-bottom: var(--space-xl);
  }

  .box-detail__topbar-center {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
  }
  .box-detail__card-count {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }

  .box-detail__title-section {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    padding: 0 var(--space-md);
  }
  .box-detail__accent {
    width: 6px;
    height: 48px;
    border-radius: 4px;
    flex-shrink: 0;
  }
  .box-detail__title {
    font-size: var(--font-size-xl);
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0;
  }

  .box-detail__dots {
    display: flex;
    justify-content: center;
    gap: var(--space-xs);
  }
  .box-detail__dot {
    width: 8px;
    height: 8px;
    border-radius: 50%;
    background: var(--color-surface-alt);
    transition: background var(--transition-fast);
  }
  .box-detail__dot--active { background: var(--color-primary); }

  .box-detail__actions {
    padding: 0 var(--space-md);
  }

  .box-detail__section {
    background: var(--color-surface);
    border-radius: var(--radius-md);
    overflow: hidden;
    margin: 0 var(--space-md);
  }
  .box-detail__section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: var(--space-md);
    width: 100%;
    cursor: pointer;
    color: var(--color-text-primary);
  }
  .box-detail__section-title {
    font-weight: 600;
    font-size: var(--font-size-base);
  }
  .box-detail__search {
    padding: 0 var(--space-md) var(--space-md);
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }
  .box-detail__search-input-wrap {
    display: flex;
    align-items: center;
    gap: var(--space-sm);
    background: var(--color-surface-alt);
    border-radius: var(--radius-md);
    padding: var(--space-sm) var(--space-md);
    color: var(--color-text-secondary);
  }
  .box-detail__search-input {
    flex: 1;
    background: transparent;
    border: none;
    outline: none;
    color: var(--color-text-primary);
  }
  .box-detail__cards-found {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin: 0;
  }

  .box-detail__cards {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
    padding: 0 var(--space-md);
  }

  /* Box menu */
  .box-menu {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }
  .box-menu__item {
    display: flex;
    align-items: center;
    gap: var(--space-md);
    padding: var(--space-md);
    border-radius: var(--radius-md);
    background: var(--color-surface-alt);
    color: var(--color-text-primary);
    width: 100%;
    font-size: var(--font-size-base);
    cursor: pointer;
    transition: background var(--transition-fast);
  }
  .box-menu__item:hover { background: var(--color-border); }
  .box-menu__item--danger { color: var(--color-danger); }
</style>
