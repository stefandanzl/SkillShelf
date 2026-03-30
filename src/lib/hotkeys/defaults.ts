import type { HotkeyConfig } from './types';

// Default keybindings - ergonomic choices for study flow
// Can be a single binding or an array of bindings
export const defaultHotkeys: HotkeyConfig = {
	// Study mode - left hand for answers
	'study.answer_again': { key: 'a' },
	'study.answer_hard': { key: 's' },
	'study.answer_easy': { key: 'd' },
	'study.flip_card': [{ key: ' ' }, { key: 'Enter' }], // Multiple bindings example
	'study.next_card': { key: 'n' },
	'study.previous_card': { key: 'p' },

	// Navigation
	'nav.go_home': { key: 'h', ctrl: true },
	'nav.go_back': { key: 'ArrowLeft', alt: true },
	'nav.go_forward': { key: 'ArrowRight', alt: true },

	// General
	'general.search': { key: 'k', ctrl: true },
	'general.settings': { key: ',' },
	'general.create': { key: 'n', ctrl: true },
	'general.help': { key: '?' }
};
