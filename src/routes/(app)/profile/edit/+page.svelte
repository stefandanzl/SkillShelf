<script lang="ts">
  import { t } from '$lib/i18n';
  import { goto } from '$app/navigation';
  import TopBar from '$lib/components/ui/TopBar.svelte';
  import Avatar from '$lib/components/ui/Avatar.svelte';
  import PillButton from '$lib/components/ui/PillButton.svelte';

  let { data } = $props();

  // Use derived for all data reads from props
  const userFromData = $derived(data?.user);
  const userId = $derived(userFromData?.id || '');
  const displayEmail = $derived(userFromData?.email || '');
  const initialName = $derived(userFromData?.name || '');

  // Local edit state
  let name = $state('');
  let birthday = $state('');
  let role = $state('');
  let country = $state('');

  const hasChanges = $derived(
    name !== initialName ||
    birthday !== '' ||
    role !== '' ||
    country !== ''
  );

  function handleSave() {
    // TODO: PocketBase integration
    goto('/profile');
  }
</script>

<div class="profile-edit">
  <TopBar
    showBack
    title={$t('profile.personal_info_title')}
    onback={() => goto('/profile')}
  >
    {#snippet right()}
      <button
        class="save-btn"
        class:save-btn--active={hasChanges}
        onclick={handleSave}
      >
        {$t('common.save')}
      </button>
    {/snippet}
  </TopBar>

  <div class="profile-edit__content">
    <!-- Avatar section -->
    <div class="profile-edit__avatar-section">
      <Avatar name={name || 'U'} size={80} />
      <button class="profile-edit__avatar-change">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
          <circle cx="12" cy="13" r="4"/>
        </svg>
        Change photo
      </button>
    </div>

    <!-- Form fields -->
    <div class="profile-edit__form">
      <div class="profile-edit__field">
        <label class="profile-edit__label" for="edit-name">{$t('profile.name')}</label>
        <input
          id="edit-name"
          class="profile-edit__input"
          type="text"
          bind:value={name}
          placeholder={$t('profile.name')}
        />
      </div>

      <div class="profile-edit__field">
        <label class="profile-edit__label" for="edit-email">{$t('profile.email')}</label>
        <input
          id="edit-email"
          class="profile-edit__input profile-edit__input--readonly"
          type="email"
          value={displayEmail}
          readonly
        />
      </div>

      <div class="profile-edit__field">
        <label class="profile-edit__label" for="edit-birthday">{$t('profile.birthday')}</label>
        <input
          id="edit-birthday"
          class="profile-edit__input"
          type="date"
          bind:value={birthday}
          placeholder={$t('profile.pick_date')}
        />
      </div>

      <div class="profile-edit__field">
        <label class="profile-edit__label" for="edit-role">{$t('profile.role')}</label>
        <input
          id="edit-role"
          class="profile-edit__input"
          type="text"
          bind:value={role}
          placeholder={$t('profile.select')}
        />
      </div>

      <div class="profile-edit__field">
        <label class="profile-edit__label" for="edit-country">{$t('profile.country')}</label>
        <input
          id="edit-country"
          class="profile-edit__input"
          type="text"
          bind:value={country}
          placeholder={$t('profile.select')}
        />
      </div>
    </div>

    <PillButton onclick={handleSave}>
      {$t('common.save')}
    </PillButton>

    {#if userId}
      <p class="profile-edit__user-id">ID: {userId}</p>
    {/if}
  </div>
</div>

<style>
  .profile-edit {
    display: flex;
    flex-direction: column;
    min-height: 100%;
  }
  .profile-edit__content {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
    padding: 0 var(--space-md) var(--space-xl);
  }
  .profile-edit__avatar-section {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: var(--space-sm);
    padding: var(--space-md) 0;
  }
  .profile-edit__avatar-change {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    color: var(--color-primary);
    font-size: var(--font-size-sm);
    font-weight: 500;
  }
  .profile-edit__form {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
  }
  .profile-edit__field {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }
  .profile-edit__label {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
  }
  .profile-edit__input {
    background: var(--color-surface);
    border: 1px solid var(--color-border);
    border-radius: var(--radius-md);
    padding: var(--space-md);
    color: var(--color-text-primary);
    width: 100%;
  }
  .profile-edit__input:focus {
    border-color: var(--color-primary);
    outline: none;
  }
  .profile-edit__input--readonly {
    color: var(--color-text-secondary);
    cursor: not-allowed;
  }
  .profile-edit__user-id {
    font-size: var(--font-size-xs);
    color: var(--color-text-disabled);
    text-align: center;
    margin: 0;
    word-break: break-all;
  }
  .save-btn {
    font-size: var(--font-size-base);
    font-weight: 600;
    color: var(--color-text-disabled);
    padding: var(--space-xs) var(--space-sm);
    transition: color var(--transition-fast);
  }
  .save-btn--active { color: var(--color-primary); }
</style>
