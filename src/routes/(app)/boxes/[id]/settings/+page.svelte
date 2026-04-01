<script lang="ts">
  import { t } from '$lib/i18n';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import TopBar from '$lib/components/ui/TopBar.svelte';
  import SettingsRow from '$lib/components/ui/SettingsRow.svelte';
  import SettingsGroup from '$lib/components/ui/SettingsGroup.svelte';
  import Toggle from '$lib/components/ui/Toggle.svelte';
  import SegmentedControl from '$lib/components/ui/SegmentedControl.svelte';
  import { pb } from '$lib/pocketbase.svelte';
  import { updateBox, deleteBox } from '$lib/api';
  import type { BoxesColorOptions } from '$lib/pocketbase-types';

  let { data } = $props();

  const boxId = $derived($page.params.id);
  const box = $derived(data.box);

  let ttsEnabled = $state(false);
  let learnDirection = $state('front-to-back');
  let selectedColor = $state('blue');

  $effect(() => {
    if (box) {
      selectedColor = box.color ?? 'blue';
      learnDirection = box.learn_direction ?? 'front-to-back';
      ttsEnabled = !!box.tts_language;
    }
  });

  const directionSegments = [
    { value: 'front-to-back', label: '→' },
    { value: 'back-to-front', label: '←' },
    { value: 'both', label: '⇄' },
  ];

  const colors = [
    { value: 'blue', css: 'var(--color-topic-blue)' },
    { value: 'red', css: 'var(--color-topic-red)' },
    { value: 'green', css: 'var(--color-topic-green)' },
    { value: 'orange', css: 'var(--color-topic-orange)' },
    { value: 'purple', css: 'var(--color-topic-purple)' },
    { value: 'teal', css: 'var(--color-topic-teal)' },
  ];

  async function handleColorChange(color: string) {
    selectedColor = color;
    await updateBox(pb as any, boxId!, { color: color as BoxesColorOptions });
  }

  async function handleRename() {
    const newName = prompt($t('box.rename'), box?.name ?? '');
    if (!newName || newName === box?.name) return;
    await updateBox(pb as any, boxId!, { name: newName });
    data.box = { ...box!, name: newName } as typeof box;
  }

  async function handleDelete() {
    if (!confirm('Delete this box and all its cards?')) return;
    await deleteBox(pb as any, boxId!);
    goto('/home');
  }
</script>

<div class="box-settings">
  <TopBar showBack title={$t('box.settings_title')} onback={() => goto(`/boxes/${boxId}`)} />

  <div class="box-settings__content">

    <!-- Learning Direction -->
    <section class="box-settings__section">
      <SettingsRow label={$t('box.learn_direction')}>
        {#snippet icon()}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M17 1l4 4-4 4"/><path d="M3 11V9a4 4 0 0 1 4-4h14"/><path d="M7 23l-4-4 4-4"/><path d="M21 13v2a4 4 0 0 1-4 4H3"/>
          </svg>
        {/snippet}
        {#snippet right()}
          <SegmentedControl
            segments={directionSegments}
            value={learnDirection}
            onchange={(v) => learnDirection = v}
          />
        {/snippet}
      </SettingsRow>
    </section>

    <!-- TTS -->
    <section class="box-settings__section">
      <SettingsRow label={$t('box.tts')}>
        {#snippet icon()}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
            <path d="M19.07 4.93a10 10 0 0 1 0 14.14"/>
          </svg>
        {/snippet}
        {#snippet right()}
          <Toggle checked={ttsEnabled} onchange={(v) => ttsEnabled = v} />
        {/snippet}
      </SettingsRow>
    </section>

    <!-- Color -->
    <section class="box-settings__section">
      <SettingsRow label={$t('box.color')}>
        {#snippet icon()}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/>
            <path d="M12 2a7 7 0 0 1 7 7c0 3.87-3.13 7-7 7a7 7 0 0 1 0-14z"/>
          </svg>
        {/snippet}
        {#snippet right()}
          <div class="color-swatches">
            {#each colors as c (c.value)}
              <button
                class="color-swatch"
                class:color-swatch--active={selectedColor === c.value}
                style="background: {c.css}"
                onclick={() => handleColorChange(c.value)}
                aria-label={c.value}
              ></button>
            {/each}
          </div>
        {/snippet}
      </SettingsRow>
    </section>

    <!-- Import / Export / Rename / Delete -->
    <section class="box-settings__section">
      <SettingsGroup>
        <SettingsRow label={$t('box.import')} onclick={() => {}}>
          {#snippet icon()}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/>
            </svg>
          {/snippet}
          {#snippet right()}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          {/snippet}
        </SettingsRow>
        <SettingsRow label={$t('box.export')} onclick={() => {}}>
          {#snippet icon()}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
          {/snippet}
          {#snippet right()}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          {/snippet}
        </SettingsRow>
        <SettingsRow label={$t('box.rename')} onclick={handleRename}>
          {#snippet icon()}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          {/snippet}
          {#snippet right()}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          {/snippet}
        </SettingsRow>
        <SettingsRow label={$t('box.delete')} onclick={handleDelete} danger>
          {#snippet icon()}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          {/snippet}
          {#snippet right()}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          {/snippet}
        </SettingsRow>
      </SettingsGroup>
    </section>

  </div>
</div>

<style>
  .box-settings {
    display: flex;
    flex-direction: column;
    min-height: 100%;
  }
  .box-settings__content {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    padding: 0 var(--space-md) var(--space-xl);
  }
  .box-settings__section {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }
  .color-swatches {
    display: flex;
    gap: var(--space-xs);
  }
  .color-swatch {
    width: 24px;
    height: 24px;
    border-radius: 50%;
    flex-shrink: 0;
    border: 2px solid transparent;
    transition: border-color var(--transition-fast), transform var(--transition-fast);
  }
  .color-swatch--active {
    border-color: white;
    transform: scale(1.2);
  }
</style>
