// All possible hotkey actions (grouped by feature area)
export type HotkeyAction =
	// Study mode
	| 'study.answer_again'
	| 'study.answer_hard'
	| 'study.answer_easy'
	| 'study.flip_card'
	| 'study.next_card'
	| 'study.previous_card'
	// Navigation
	| 'nav.go_home'
	| 'nav.go_back'
	| 'nav.go_forward'
	// General
	| 'general.search'
	| 'general.settings'
	| 'general.create'
	| 'general.help';

export interface HotkeyBinding {
	key: string;
	ctrl?: boolean;
	shift?: boolean;
	alt?: boolean;
	meta?: boolean;
}

// Support multiple bindings per action
export interface HotkeyConfig {
	[action: string]: HotkeyBinding | HotkeyBinding[];
}

// Helper to get bindings as array
export function getBindingsAsArray(config: HotkeyConfig, action: string): HotkeyBinding[] {
	const binding = config[action];
	if (!binding) return [];
	if (Array.isArray(binding)) return binding;
	return [binding];
}

// Helper to set bindings (accepts single or array)
export function setBindings(config: HotkeyConfig, action: string, bindings: HotkeyBinding | HotkeyBinding[]) {
	config[action] = bindings;
}

export interface HotkeyHandler {
	action: HotkeyAction;
	handler: (e: KeyboardEvent) => void;
	// Optional: only fire when this condition is true
	condition?: () => boolean;
}

// Get the i18n key for a hotkey action (for labels)
export function getHotkeyI18nKey(action: HotkeyAction): string {
	return action.replace('.', '_') as string;
}

// Group actions for UI organization
export const HotkeyGroups: Record<string, HotkeyAction[]> = {
	Study: [
		'study.answer_again',
		'study.answer_hard',
		'study.answer_easy',
		'study.flip_card',
		'study.next_card',
		'study.previous_card'
	],
	Navigation: [
		'nav.go_home',
		'nav.go_back',
		'nav.go_forward'
	],
	General: [
		'general.search',
		'general.settings',
		'general.create',
		'general.help'
	]
};
