import { browser } from '$app/environment';
import { dev } from '$app/environment';
import type { HotkeyAction, HotkeyBinding, HotkeyConfig, HotkeyHandler } from './types';
import { defaultHotkeys as defaults } from './defaults';

// Re-export defaults for settings page
export { defaultHotkeys } from './defaults';

// User's custom hotkeys - stored as arrays of binding strings for easier serialization
// Format: { 'study.flip_card': [' ', 'Enter'] }
let userHotkeys: Record<string, string[]> = {};

/**
 * Get all current hotkey bindings (defaults + user overrides)
 */
export function getHotkeys(): HotkeyConfig {
	const result: HotkeyConfig = {};

	// Start with defaults
	for (const action in defaults) {
		if (userHotkeys[action]) {
			// User has custom bindings
			result[action] = userHotkeys[action].map(parseBindingString);
		} else {
			// Use default (could be single or array)
			const def = (defaults as Record<string, HotkeyBinding | HotkeyBinding[]>)[action];
			result[action] = def;
		}
	}

	return result;
}

// Registered handlers - components add/remove these
const handlers = new Set<HotkeyHandler>();

/**
 * Register a hotkey handler from a component
 * Returns an unsubscribe function
 */
export function registerHotkey(
	action: HotkeyAction,
	handler: (e: KeyboardEvent) => void,
	condition?: () => boolean
): () => void {
	const registration: HotkeyHandler = { action, handler, condition };
	handlers.add(registration);

	// Return unsubscribe function
	return () => {
		handlers.delete(registration);
	};
}

/**
 * Check if an element should ignore hotkeys (inputs, textareas, etc.)
 */
function shouldIgnoreHotkeys(target: EventTarget | null): boolean {
	if (!target || !browser) return false;

	const element = target as Element;
	const tagName = element.tagName.toLowerCase();
	const isInput = tagName === 'input' || tagName === 'textarea' || tagName === 'select';
	const isContentEditable = element.getAttribute('contenteditable') === 'true';

	return isInput || isContentEditable;
}

/**
 * Check if a keyboard event matches a hotkey binding
 */
export function eventMatchesBinding(
	event: KeyboardEvent,
	binding: HotkeyBinding
): boolean {
	// Check key (case-insensitive)
	const key = binding.key.toLowerCase();
	const eventKey = event.key.toLowerCase();

	// For special keys like ArrowLeft, Space, etc., use exact match
	const keyMatches = key.length > 1 ? eventKey === key : eventKey === key;

	if (!keyMatches) return false;

	// Check modifiers (treat Cmd as Ctrl on Mac)
	const ctrlMatches = !!binding.ctrl === (event.ctrlKey || event.metaKey);
	const shiftMatches = !!binding.shift === event.shiftKey;
	const altMatches = !!binding.alt === event.altKey;
	const metaMatches = !!binding.meta === event.metaKey;

	return ctrlMatches && shiftMatches && altMatches && metaMatches;
}

/**
 * Get the action for a keyboard event, or null if no binding matches
 */
export function getActionForEvent(event: KeyboardEvent): HotkeyAction | null {
	const bindings = getHotkeys();

	// Check each action's bindings
	for (const [action, bindingOrArray] of Object.entries(bindings)) {
		const bindingsArray = Array.isArray(bindingOrArray) ? bindingOrArray : [bindingOrArray];

		// Check if event matches any of this action's bindings
		for (const binding of bindingsArray) {
			if (eventMatchesBinding(event, binding)) {
				return action as HotkeyAction;
			}
		}
	}

	return null;
}

/**
 * Format a hotkey binding for display (e.g., "Ctrl+K", "S")
 */
export function formatBinding(binding: HotkeyBinding): string {
	const parts: string[] = [];

	if (binding.ctrl) parts.push('Ctrl');
	if (binding.alt) parts.push('Alt');
	if (binding.shift) parts.push('Shift');
	if (binding.meta) parts.push('Cmd');

	// Format key name
	let key = binding.key;
	if (key === ' ') key = 'Space';
	else if (key.startsWith('Arrow')) key = key.replace('Arrow', '');

	parts.push(key.charAt(0).toUpperCase() + key.slice(1));

	return parts.join('+');
}

/**
 * Execute a hotkey action by finding and calling matching handlers
 */
function executeAction(action: HotkeyAction, event: KeyboardEvent): boolean {
	for (const handler of handlers) {
		if (handler.action === action) {
			// Check condition if provided
			if (handler.condition && !handler.condition()) {
				continue;
			}
			handler.handler(event);
			return true; // Handler found and executed
		}
	}
	return false; // No handler found
}

/**
 * Global keyboard event listener
 */
function handleKeyDown(event: KeyboardEvent) {
	if (!browser) return;

	// Ignore hotkeys in inputs
	if (shouldIgnoreHotkeys(event.target)) {
		return;
	}

	const action = getActionForEvent(event);
	if (action) {
		dev && console.log(`[hotkeys] Action triggered: ${action}`);
		const handled = executeAction(action, event);
		if (handled) {
			event.preventDefault();
			event.stopPropagation();
		}
	}
}

/**
 * Initialize global hotkey listener (call once in app layout)
 */
export function initHotkeys() {
	if (!browser) return;

	window.addEventListener('keydown', handleKeyDown);
	dev && console.log('[hotkeys] Initialized');

	return () => {
		window.removeEventListener('keydown', handleKeyDown);
	};
}

/**
 * Load user's custom hotkeys from profile
 */
export function loadUserHotkeys(customHotkeys: Record<string, string[]> | null | undefined) {
	userHotkeys = customHotkeys ?? {};
	dev && console.log('[hotkeys] Loaded user hotkeys:', customHotkeys);
}

/**
 * Get user's custom hotkeys (for saving)
 */
export function getUserHotkeys(): Record<string, string[]> {
	return { ...userHotkeys };
}

/**
 * Check if an action has custom hotkeys
 */
export function hasCustomHotkeys(action: string): boolean {
	return action in userHotkeys;
}

/**
 * Get the current bindings for an action (as strings for UI)
 */
export function getBindingsForActionStrings(action: string): string[] {
	if (userHotkeys[action]) {
		return userHotkeys[action];
	}

	// Return default bindings as strings
	const defaultBinding = (defaults as Record<string, HotkeyBinding | HotkeyBinding[]>)[action];
	if (!defaultBinding) return [];

	if (Array.isArray(defaultBinding)) {
		return defaultBinding.map(bindingToString);
	}
	return [bindingToString(defaultBinding)];
}

/**
 * Add a custom hotkey to an action
 */
export function addCustomHotkey(action: string, bindingString: string) {
	if (!userHotkeys[action]) {
		userHotkeys[action] = [];
	}

	// Don't add duplicates
	if (!userHotkeys[action].includes(bindingString)) {
		userHotkeys[action] = [...userHotkeys[action], bindingString];
	}
}

/**
 * Remove a specific custom hotkey from an action
 */
export function removeCustomHotkey(action: string, bindingString: string) {
	if (userHotkeys[action]) {
		userHotkeys[action] = userHotkeys[action].filter(b => b !== bindingString);

		// If empty, delete the key
		if (userHotkeys[action].length === 0) {
			delete userHotkeys[action];
		}
	}
}

/**
 * Clear all custom hotkeys for an action
 */
export function clearCustomHotkeys(action: string) {
	delete userHotkeys[action];
}

/**
 * Reset all custom hotkeys
 */
export function resetAllCustomHotkeys() {
	userHotkeys = {};
}

/**
 * Check if a binding conflicts with another action's bindings
 */
export function getBindingConflict(
	binding: HotkeyBinding,
	excludeAction?: string
): HotkeyAction | null {
	const bindings = getHotkeys();

	for (const [action, bindingOrArray] of Object.entries(bindings)) {
		if (excludeAction && action === excludeAction) continue;

		const bindingsArray = Array.isArray(bindingOrArray) ? bindingOrArray : [bindingOrArray];

		for (const existingBinding of bindingsArray) {
			const sameKey = existingBinding.key.toLowerCase() === binding.key.toLowerCase();
			const sameCtrl = !!existingBinding.ctrl === !!binding.ctrl;
			const sameAlt = !!existingBinding.alt === !!binding.alt;
			const sameShift = !!existingBinding.shift === !!binding.shift;
			const sameMeta = !!existingBinding.meta === !!binding.meta;

			if (sameKey && sameCtrl && sameAlt && sameShift && sameMeta) {
				return action as HotkeyAction;
			}
		}
	}

	return null;
}

/**
 * Convert string representation to HotkeyBinding (for settings UI)
 * Format: "key" or "ctrl+key" or "ctrl+shift+key", etc.
 */
export function parseBindingString(str: string): HotkeyBinding {
	const parts = str.toLowerCase().split('+').map(p => p.trim());

	const binding: HotkeyBinding = {
		key: parts[parts.length - 1] // Last part is always the key
	};

	for (const part of parts.slice(0, -1)) {
		switch (part) {
			case 'ctrl':
				binding.ctrl = true;
				break;
			case 'alt':
				binding.alt = true;
				break;
			case 'shift':
				binding.shift = true;
				break;
			case 'cmd':
			case 'meta':
				binding.meta = true;
				break;
		}
	}

	return binding;
}

/**
 * Convert HotkeyBinding to string representation (for storage)
 */
export function bindingToString(binding: HotkeyBinding): string {
	const parts: string[] = [];

	if (binding.ctrl) parts.push('ctrl');
	if (binding.alt) parts.push('alt');
	if (binding.shift) parts.push('shift');
	if (binding.meta) parts.push('meta');

	parts.push(binding.key.toLowerCase());

	return parts.join('+');
}

/**
 * Save user's custom hotkeys (to be called from settings page)
 */
export async function saveUserHotkeys(customHotkeys: Record<string, string[]>) {
	userHotkeys = customHotkeys;
	// TODO: Save to user profile in PocketBase
	dev && console.log('[hotkeys] Saved user hotkeys:', customHotkeys);
}
