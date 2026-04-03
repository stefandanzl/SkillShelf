<script lang="ts">
  import { t } from '$lib/i18n';
  import { goto } from '$app/navigation';
  import TopBar from '$lib/components/ui/TopBar.svelte';
  import SettingsRow from '$lib/components/ui/SettingsRow.svelte';
  import SettingsGroup from '$lib/components/ui/SettingsGroup.svelte';
  import SegmentedControl from '$lib/components/ui/SegmentedControl.svelte';
  import Toggle from '$lib/components/ui/Toggle.svelte';
  import { locale, setLocale } from '$lib/i18n';
  import { pb } from '$lib/pocketbase.svelte';

  interface UserSettings {
    enableMarkdown?: boolean;
    showStudyButtons?: boolean;
    language?: string;
  }

  let theme = $state('auto');
  let reminderEnabled = $state(false);
  let cloudSyncEnabled = $state(true);
  let enableMarkdown = $state(true);

  // Load settings from user on mount
  const user = $derived(pb.authStore.record as any);
  $effect(() => {
    if (user?.settings) {
      enableMarkdown = user.settings.enableMarkdown ?? true;
    }
  });

  // Save settings to user
  async function saveSetting<K extends keyof UserSettings>(key: K, value: UserSettings[K]) {
    if (!user) return;
    const currentSettings = (user.settings || {}) as UserSettings;
    const updatedSettings = { ...currentSettings, [key]: value };
    await pb.collection('users').update(user.id, { settings: updatedSettings });
    // Update auth store record directly so changes are reflected immediately
    if (pb.authStore.record) {
      (pb.authStore.record as any).settings = { ...(pb.authStore.record as any).settings, ...updatedSettings };
    }
  }

  async function toggleMarkdown() {
    enableMarkdown = !enableMarkdown;
    await saveSetting('enableMarkdown', enableMarkdown);
  }

  const themeSegments = $derived([
    { value: 'auto', label: $t('settings.theme_auto') },
    { value: 'light', label: $t('settings.theme_light') },
    { value: 'dark', label: $t('settings.theme_dark') },
  ]);

  const currentLocale = $derived($locale ?? 'en');
  const languageLabel = $derived(currentLocale === 'de' ? 'Deutsch' : 'English');

  function toggleLanguage() {
    const newLocale = currentLocale === 'de' ? 'en' : 'de';
    setLocale(newLocale);
  }
</script>

<div class="settings">
  <TopBar title={$t('settings.title')} />

  <div class="settings__content">

    <!-- Theme -->
    <section class="settings__section">
      <SettingsRow label={$t('settings.theme')}>
        {#snippet icon()}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
        {/snippet}
        {#snippet right()}
          <SegmentedControl
            segments={themeSegments}
            value={theme}
            onchange={(v) => theme = v}
          />
        {/snippet}
      </SettingsRow>
    </section>

    <!-- Reminder -->
    <section class="settings__section">
      <SettingsRow label={$t('settings.reminder')}>
        {#snippet icon()}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
        {/snippet}
        {#snippet right()}
          <Toggle checked={reminderEnabled} onchange={(v) => reminderEnabled = v} />
        {/snippet}
      </SettingsRow>
    </section>

    <!-- Language -->
    <section class="settings__section">
      <SettingsRow label={$t('settings.language')} onclick={toggleLanguage}>
        {#snippet icon()}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><line x1="2" y1="12" x2="22" y2="12"/>
            <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/>
          </svg>
        {/snippet}
        {#snippet right()}
          <span class="settings__lang-label">{languageLabel}</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        {/snippet}
      </SettingsRow>
    </section>

    <!-- Study Settings -->
    <div class="settings__section-label">Study</div>
    <section class="settings__section">
      <SettingsRow label="Markdown in cards">
        {#snippet icon()}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
            <polyline points="14 2 14 8 20 8"/>
            <line x1="16" y1="13" x2="8" y2="13"/>
            <line x1="16" y1="17" x2="8" y2="17"/>
            <line x1="10" y1="9" x2="8" y2="9"/>
          </svg>
        {/snippet}
        {#snippet right()}
          <Toggle checked={enableMarkdown} onchange={toggleMarkdown} />
        {/snippet}
      </SettingsRow>
    </section>

    <!-- Hotkeys -->
    <section class="settings__section">
      <SettingsRow label={$t('settings.hotkeys')} onclick={() => goto('/settings/hotkeys')}>
        {#snippet icon()}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <rect x="2" y="4" width="20" height="16" rx="2"/>
            <path d="M6 8h.01"/><path d="M10 8h.01"/><path d="M14 8h.01"/><path d="M18 8h.01"/>
            <path d="M6 12h.01"/><path d="M10 12h.01"/><path d="M14 12h.01"/><path d="M18 12h.01"/>
          </svg>
        {/snippet}
        {#snippet right()}
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        {/snippet}
      </SettingsRow>
    </section>

    <!-- Cloud Sync + Trash -->
    <section class="settings__section">
      <SettingsGroup>
        <SettingsRow label={$t('settings.cloud_sync')}>
          {#snippet icon()}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="16 17 21 12 16 7"/><polyline points="8 7 3 12 8 17"/>
            </svg>
          {/snippet}
          {#snippet right()}
            <Toggle checked={cloudSyncEnabled} onchange={(v) => cloudSyncEnabled = v} />
          {/snippet}
        </SettingsRow>
        <SettingsRow label={$t('settings.trash')} onclick={() => {}}>
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

    <!-- Help & Support -->
    <div class="settings__section-label">{$t('settings.section_help')}</div>
    <section class="settings__section">
      <SettingsGroup>
        <SettingsRow label={$t('settings.support')} onclick={() => {}}>
          {#snippet icon()}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
          {/snippet}
          {#snippet right()}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          {/snippet}
        </SettingsRow>
        <SettingsRow label={$t('settings.tutorial')} onclick={() => {}}>
          {#snippet icon()}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="5 3 19 12 5 21 5 3"/>
            </svg>
          {/snippet}
          {#snippet right()}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          {/snippet}
        </SettingsRow>
        <SettingsRow label={$t('settings.faq')} onclick={() => {}}>
          {#snippet icon()}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
          {/snippet}
          {#snippet right()}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          {/snippet}
        </SettingsRow>
        <SettingsRow label={$t('settings.news')} onclick={() => {}}>
          {#snippet icon()}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22 6 12 13 2 6"/>
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
  .settings {
    display: flex;
    flex-direction: column;
    min-height: 100%;
  }
  .settings__content {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    padding: 0 var(--space-md) var(--space-xl);
  }
  .settings__section {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }
  .settings__section-label {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0 var(--space-xs);
    margin-top: var(--space-sm);
  }
  .settings__lang-label {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
  }
</style>
