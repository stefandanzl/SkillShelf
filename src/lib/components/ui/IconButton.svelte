<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		variant?: 'default' | 'primary' | 'ghost' | 'danger';
		size?: number;
		onclick?: () => void;
		title?: string;
		type?: 'button' | 'submit' | 'reset';
		disabled?: boolean;
		children?: Snippet;
	}
	let { variant = 'default', size = 40, onclick, title, type = 'button', disabled = false, children }: Props = $props();

	const finalVariant = $derived(disabled ? 'disabled' : variant);
</script>

<button {type} {title} class="icon-btn icon-btn--{finalVariant}" style="width: {size}px; height: {size}px;" {onclick}>
	{#if children}{@render children()}{/if}
</button>

<style>
	.icon-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		border-radius: 50%;
		flex-shrink: 0;
		transition: opacity var(--transition-fast);
	}
	.icon-btn:hover {
		opacity: 0.8;
	}
	.icon-btn:active {
		opacity: 0.6;
	}

	.icon-btn--default {
		background: var(--color-surface);
		color: var(--color-text-primary);
	}
	.icon-btn--primary {
		background: var(--color-primary);
		color: #fff;
	}
	.icon-btn--ghost {
		background: transparent;
		color: var(--color-text-primary);
	}
	.icon-btn--danger {
		background: var(--color-danger);
		color: #fff;
	}

	.icon-btn--disabled {
		pointer-events: none;
		background: var(--color-surface-alt);
		color: var(--color-text-secondary);
		opacity: 0.6;
	}
</style>
