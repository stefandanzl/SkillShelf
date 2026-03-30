<script lang="ts">
  import { t } from '$lib/i18n';
  import { enhance } from '$app/forms';
  import { goto, invalidateAll } from '$app/navigation';
  import TopBar from '$lib/components/ui/TopBar.svelte';
  import Avatar from '$lib/components/ui/Avatar.svelte';
  import SettingsRow from '$lib/components/ui/SettingsRow.svelte';
  import SettingsGroup from '$lib/components/ui/SettingsGroup.svelte';
  import PillButton from '$lib/components/ui/PillButton.svelte';
  import { pb } from '$lib/pocketbase.svelte';

  let { data, form } = $props();

  async function handleSignOut() {
    // Clear client-side auth
    pb.authStore.clear();

    // Clear the cookie
    document.cookie = 'pb_auth=; path=/; max-age=0';

    // Invalidate all cached data
    await invalidateAll();

    // Go to landing page
    goto('/');
  }

  const username = $derived(data?.user?.name || 'User');
  const email = $derived(data?.user?.email || '');

  let showDeleteConfirm = $state(false);
</script>

<div class="profile">
  <TopBar title={$t('profile.title')}>
    {#snippet right()}
      <button class="profile__edit-btn" onclick={() => goto('/profile/edit')}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>
    {/snippet}
  </TopBar>

  <div class="profile__content">
    <!-- User Card -->
    <div class="profile__user-card">
      <Avatar name={username} size={72} />
      <div class="profile__user-info">
        <h2 class="profile__name">{username}</h2>
        <p class="profile__email">{email}</p>
      </div>
    </div>

    <!-- Pro Subscription -->
    <section class="profile__section">
      <SettingsRow label={$t('profile.pro_subscription')} onclick={() => {}} accentBorder>
        {#snippet icon()}
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
          </svg>
        {/snippet}
        {#snippet right()}
          <span class="profile__pro-badge">PRO</span>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
        {/snippet}
      </SettingsRow>
    </section>

    <!-- Account section -->
    <div class="profile__section-label">{$t('profile.section_account')}</div>
    <section class="profile__section">
      <SettingsGroup>
        <SettingsRow label={$t('profile.change_password')} onclick={() => {}}>
          {#snippet icon()}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
            </svg>
          {/snippet}
          {#snippet right()}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          {/snippet}
        </SettingsRow>
        <SettingsRow label={$t('profile.sign_out')} onclick={handleSignOut}>
          {#snippet icon()}
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>
            </svg>
          {/snippet}
          {#snippet right()}
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          {/snippet}
        </SettingsRow>
        <SettingsRow label={$t('profile.delete_account')} onclick={() => showDeleteConfirm = true} danger>
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

    {#if showDeleteConfirm}
      <div class="profile__delete-confirm">
        <p class="profile__delete-text">Are you sure? This action cannot be undone.</p>
        <PillButton variant="danger-fill" onclick={() => {}}>
          {$t('common.confirm')} — {$t('profile.delete_account')}
        </PillButton>
        <button class="profile__cancel" onclick={() => showDeleteConfirm = false}>
          {$t('common.cancel')}
        </button>
      </div>
    {/if}
  </div>
</div>

<style>
  .profile {
    display: flex;
    flex-direction: column;
    min-height: 100%;
  }
  .profile__content {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    padding: 0 var(--space-md) var(--space-xl);
  }
  .profile__user-card {
    background: var(--color-surface);
    border-radius: var(--radius-lg);
    padding: var(--space-lg);
    display: flex;
    align-items: center;
    gap: var(--space-md);
    box-shadow: var(--shadow-card);
  }
  .profile__user-info {
    display: flex;
    flex-direction: column;
    gap: 4px;
    min-width: 0;
  }
  .profile__name {
    font-size: var(--font-size-lg);
    font-weight: 700;
    color: var(--color-text-primary);
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .profile__email {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .profile__section {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }
  .profile__section-label {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    padding: 0 var(--space-xs);
    margin-top: var(--space-sm);
  }
  .profile__pro-badge {
    background: var(--color-primary);
    color: white;
    font-size: var(--font-size-xs);
    font-weight: 700;
    padding: 2px 8px;
    border-radius: var(--radius-pill);
    letter-spacing: 0.05em;
  }
  .profile__edit-btn {
    color: var(--color-primary);
    padding: var(--space-xs);
  }
  .profile__delete-confirm {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    background: var(--color-danger-dim);
    border-radius: var(--radius-md);
    padding: var(--space-md);
    border: 1px solid var(--color-danger);
  }
  .profile__delete-text {
    color: var(--color-danger);
    font-size: var(--font-size-sm);
    margin: 0;
    text-align: center;
  }
  .profile__cancel {
    font-size: var(--font-size-base);
    color: var(--color-text-secondary);
    text-align: center;
    padding: var(--space-sm);
    width: 100%;
  }
</style>
