<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';
  import TopBar from '$lib/components/ui/TopBar.svelte';
  import {
    parseBindingString,
    getBindingConflict,
    getHotkeys
  } from '$lib/hotkeys';
  import { HotkeyGroups, getHotkeyI18nKey, type HotkeyAction } from '$lib/hotkeys/types';
  import { t } from '$lib/i18n';
  import { pb } from '$lib/pocketbase.svelte';

  // Local state for user overrides only - Record<action, bindingString[]>
  let userBindings = $state<Record<string, string[]>>({});

  // Cache of default bindings
  let defaultBindings: Record<string, string[]> = $state({});

  // Recording state
  let recordingAction: HotkeyAction | null = $state(null);
  let recordedModifiers = $state({ ctrl: false, alt: false, shift: false, meta: false });

  onMount(() => {
    loadDefaults();
  });

  function loadDefaults() {
    const hotkeys = getHotkeys();
    const defaults: Record<string, string[]> = {};

    for (const [action, bindingOrArray] of Object.entries(hotkeys)) {
      const array = Array.isArray(bindingOrArray) ? bindingOrArray : [bindingOrArray];
      defaults[action] = array.map(b => bindingToString(b));
    }

    defaultBindings = defaults;
  }

  function bindingToString(binding: any): string {
    const parts: string[] = [];
    if (binding.ctrl) parts.push('ctrl');
    if (binding.alt) parts.push('alt');
    if (binding.shift) parts.push('shift');
    if (binding.meta) parts.push('meta');
    parts.push(binding.key.toLowerCase());
    return parts.join('+');
  }

  function getBindingsForAction(action: string): string[] {
    // Return user overrides if present, otherwise defaults
    return userBindings[action] || defaultBindings[action] || [];
  }

  function isUsingDefaults(action: string): boolean {
    return !userBindings[action];
  }

  function hasConflict(action: string, bindingString: string): boolean {
    // Check if this binding is used by any other action
    // Check both user bindings and defaults
    const allBindings = getBindingsForAction(action);

    for (const [otherAction] of Object.entries(defaultBindings)) {
      if (otherAction === action) continue;

      const otherBindings = getBindingsForAction(otherAction);
      if (otherBindings.includes(bindingString)) {
        return true;
      }
    }
    return false;
  }

  function hasCustomHotkeys(action: string): boolean {
    // Check if differs from default
    // For now, we'll track this separately
    return false;
  }

  function startRecording(action: HotkeyAction) {
    recordingAction = action;
    recordedModifiers = { ctrl: false, alt: false, shift: false, meta: false };
  }

  function stopRecording() {
    recordingAction = null;
    recordedModifiers = { ctrl: false, alt: false, shift: false, meta: false };
  }

  function handleKeyDown(e: KeyboardEvent) {
    if (recordingAction === null) return;

    e.preventDefault();
    e.stopPropagation();

    // Track modifiers
    recordedModifiers.ctrl = e.ctrlKey || e.metaKey;
    recordedModifiers.alt = e.altKey;
    recordedModifiers.shift = e.shiftKey;
    recordedModifiers.meta = e.metaKey;

    // Escape cancels
    if (e.key === 'Escape') {
      stopRecording();
      return;
    }

    // Ignore modifier-only presses
    if (['Control', 'Alt', 'Shift', 'Meta'].includes(e.key)) {
      return;
    }

    // Build binding string
    const parts: string[] = [];
    if (recordedModifiers.ctrl) parts.push('ctrl');
    if (recordedModifiers.alt) parts.push('alt');
    if (recordedModifiers.shift) parts.push('shift');
    if (recordedModifiers.meta) parts.push('meta');
    parts.push(e.key.toLowerCase());

    const bindingString = parts.join('+');

    // Check for conflicts
    const binding = parseBindingString(bindingString);
    const conflict = getBindingConflict(binding, recordingAction);

    if (conflict) {
      console.warn(`Conflict with: ${conflict}`);
    }

    // Add the hotkey
    if (!userBindings[recordingAction]) {
      userBindings[recordingAction] = [];
    }

    // Don't add duplicates
    if (!userBindings[recordingAction].includes(bindingString)) {
      userBindings[recordingAction] = [...userBindings[recordingAction], bindingString];
    }

    stopRecording();

    // TODO: Save to user profile
    console.log('User bindings after add:', userBindings);
  }

  function removeHotkey(action: string, bindingString: string) {
    // Get all current bindings for this action (defaults or user overrides)
    const currentBindings = getBindingsForAction(action);

    // Remove the specified binding
    const newBindings = currentBindings.filter(b => b !== bindingString);

    // Always update userBindings - if matches defaults, we'll clear it; otherwise save the override
    if (newBindings.length === 0) {
      // No bindings left - explicitly set to empty
      userBindings[action] = [];
    } else if (JSON.stringify(newBindings) === JSON.stringify(defaultBindings[action])) {
      // Matches defaults exactly - remove user override to use defaults
      delete userBindings[action];
    } else {
      // Different from defaults - save as user override
      userBindings[action] = newBindings;
    }

    // Force reactivity by creating new object reference
    userBindings = { ...userBindings };

    console.log('User bindings after remove:', userBindings);
  }

  function resetToDefault(action: string) {
    // Remove user override (will fall back to defaults)
    delete userBindings[action];
    // TODO: Save to user profile
    console.log('User bindings after reset:', userBindings);
  }

  function resetAll() {
    userBindings = {};
    // TODO: Save to user profile
    console.log('User bindings after reset all:', userBindings);
  }

  function formatHotkeyDisplay(bindingString: string): string {
    const parts = bindingString.split('+').map(p => {
      const part = p.toLowerCase();
      switch (part) {
        case 'ctrl': return 'Ctrl';
        case 'alt': return 'Alt';
        case 'shift': return 'Shift';
        case 'meta':
        case 'cmd': return '⌘';
        default:
          return part.charAt(0).toUpperCase() + part.slice(1);
      }
    });
    return parts.join('+');
  }
</script>

<svelte:window onkeydown={handleKeyDown} />

<div class="hotkeys-settings">
  <TopBar title="Hotkeys" showBack onback={() => goto('/settings')} />

  <div class="hotkeys-settings__content">
    <div class="hotkeys-settings__header">
      <p class="hotkeys-settings__description">
        Customize your keyboard shortcuts. Click the + button to record a new hotkey.
      </p>
    </div>

    {#each Object.entries(HotkeyGroups) as [groupName, actions]}
      <div class="hotkeys-settings__group">
        <h3 class="hotkeys-settings__group-title">{groupName}</h3>

        {#each actions as action}
          {@const bindings = getBindingsForAction(action)}
          {@const isRecording = recordingAction === action}

          <div class="hotkey-item" class:hotkey-item--recording={isRecording}>
            <div class="hotkey-item__info">
              <div class="hotkey-item__name">{$t(`hotkeys.${getHotkeyI18nKey(action)}`)}</div>
            </div>

            <div class="hotkey-item__control">
              {#if isRecording}
                <div class="hotkey-display hotkey-display--recording">
                  Press keys... <span class="hotkey-display__escape">Esc to cancel</span>
                </div>
              {:else}
                <!-- Render all hotkey badges -->
                <div class="hotkey-badges">
                  {#each bindings as binding}
                    {@const conflict = hasConflict(action, binding)}
                    <div class="hotkey-badge" class:hotkey-badge--conflict={conflict}>
                      <span class="hotkey-badge__text">{formatHotkeyDisplay(binding)}</span>
                      <button
                        class="hotkey-badge__delete"
                        onclick={() => removeHotkey(action, binding)}
                        title="Delete this hotkey"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                          <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                        </svg>
                      </button>
                    </div>
                  {/each}
                </div>
              {/if}

              {#if !isRecording}
                <!-- Reset to default -->
                <button
                  class="hotkey-item__restore"
                  onclick={() => resetToDefault(action)}
                  title="Reset to default"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
                    <path d="M3 3v5h5"/>
                  </svg>
                </button>

                <!-- Add new hotkey -->
                <button
                  class="hotkey-item__add"
                  onclick={() => startRecording(action)}
                  title="Add hotkey"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <path d="M8 12h8"/><path d="M12 8v8"/>
                  </svg>
                </button>

                <!-- Clear all custom hotkeys -->
                <!-- <button
                  class="hotkey-item__clear"
                  onclick={() => resetToDefault(action)}
                  title="Clear all custom hotkeys"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                  </svg>
                </button> -->
              {:else}
                <!-- Cancel recording -->
                <button
                  class="hotkey-item__cancel"
                  onclick={stopRecording}
                  title="Cancel"
                >
                  Cancel
                </button>
              {/if}
            </div>
          </div>
        {/each}
      </div>
    {/each}

    <div class="hotkeys-settings__footer">
      <button class="hotkeys-settings__reset-all" onclick={resetAll}>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/>
          <path d="M3 3v5h5"/>
        </svg>
        Reset All to Defaults
      </button>
    </div>
  </div>
</div>

<style>
  .hotkeys-settings {
    display: flex;
    flex-direction: column;
    min-height: 100%;
  }

  .hotkeys-settings__content {
    display: flex;
    flex-direction: column;
    gap: var(--space-lg);
    padding: 0 var(--space-md) var(--space-xl);
  }

  .hotkeys-settings__header {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
  }

  .hotkeys-settings__description {
    font-size: var(--font-size-sm);
    color: var(--color-text-secondary);
    margin: 0;
  }

  .hotkeys-settings__group {
    display: flex;
    flex-direction: column;
    gap: var(--space-xs);
  }

  .hotkeys-settings__group-title {
    font-size: var(--font-size-sm);
    font-weight: 600;
    color: var(--color-text-secondary);
    text-transform: uppercase;
    letter-spacing: 0.05em;
    margin: 0;
    padding: 0 var(--space-xs);
  }

  .hotkey-item {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: var(--space-md);
    padding: var(--space-md);
    background: var(--color-surface);
    border-radius: var(--radius-md);
  }

  .hotkey-item--recording {
    border: 1px solid var(--color-primary);
    box-shadow: 0 0 0 2px var(--color-primary-dim);
  }

  .hotkey-item__info {
    flex: 1;
    min-width: 0;
  }

  .hotkey-item__name {
    font-size: var(--font-size-base);
    font-weight: 500;
    color: var(--color-text-primary);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .hotkey-item__control {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    flex-wrap: wrap;
  }

  .hotkey-badges {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    flex-wrap: wrap;
  }

  .hotkey-badge {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-xs) var(--space-sm);
    background: var(--color-surface-alt);
    border-radius: var(--radius-sm);
    color: var(--color-text-primary);
    font-size: var(--font-size-sm);
  }

  .hotkey-badge__text {
    font-weight: 500;
  }

  .hotkey-badge__delete {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 16px;
    height: 16px;
    padding: 0;
    margin-left: 2px;
    background: transparent;
    border: none;
    border-radius: var(--radius-sm);
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .hotkey-badge__delete:hover {
    background: var(--color-danger);
    color: white;
  }

  .hotkey-badge--conflict {
    background: var(--color-danger);
    color: white;
  }

  .hotkey-badge--conflict .hotkey-badge__delete {
    color: white;
  }

  .hotkey-badge--conflict .hotkey-badge__delete:hover {
    background: rgba(255, 255, 255, 0.2);
  }

  .hotkey-display {
    display: flex;
    align-items: center;
    gap: var(--space-xs);
    padding: var(--space-xs) var(--space-sm);
    background: var(--color-surface-alt);
    border-radius: var(--radius-sm);
    color: var(--color-text-primary);
    font-size: var(--font-size-sm);
  }

  .hotkey-display--recording {
    color: var(--color-primary);
    animation: pulse 1s infinite;
  }

  .hotkey-display__escape {
    opacity: 0.7;
    font-size: var(--font-size-xs);
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }

  .hotkey-item__restore,
  .hotkey-item__add,
  .hotkey-item__clear {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    padding: 0;
    background: transparent;
    border: none;
    border-radius: var(--radius-sm);
    color: var(--color-text-secondary);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .hotkey-item__restore:hover,
  .hotkey-item__add:hover {
    background: var(--color-surface-alt);
    color: var(--color-text-primary);
  }

  .hotkey-item__clear:hover {
    background: var(--color-danger-dim);
    color: var(--color-danger);
  }

  .hotkey-item__cancel {
    padding: var(--space-xs) var(--space-sm);
    font-size: var(--font-size-sm);
    color: var(--color-danger);
    background: transparent;
    border: 1px solid var(--color-danger);
    border-radius: var(--radius-sm);
    cursor: pointer;
    transition: all var(--transition-fast);
  }

  .hotkey-item__cancel:hover {
    background: var(--color-danger);
    color: white;
  }

  .hotkeys-settings__footer {
    display: flex;
    justify-content: center;
    padding: var(--space-lg) 0;
  }

  .hotkeys-settings__reset-all {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: var(--space-xs);
    font-size: var(--font-size-sm);
    color: var(--color-danger);
    background: var(--color-danger-dim);
    border: 1px solid var(--color-danger);
    border-radius: var(--radius-md);
    padding: var(--space-sm) var(--space-md);
    cursor: pointer;
    transition: opacity var(--transition-fast);
  }

  .hotkeys-settings__reset-all:hover {
    opacity: 0.8;
  }
</style>
