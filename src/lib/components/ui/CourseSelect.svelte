<script lang="ts">
	import { pb } from '$lib/pocketbase.svelte';
	import { createCourse } from '$lib/api';
	import type { CoursesRecord } from '$lib/pocketbase-types';

	interface Props {
		courses: CoursesRecord[];
		value: string;
		onchange?: (id: string) => void;
		oncreated?: (course: CoursesRecord) => void;
	}

	let { courses, value, onchange, oncreated }: Props = $props();

	let open = $state(false);
	let newName = $state('');
	let creating = $state(false);
	let wrapEl: HTMLDivElement;

	const isDuplicate = $derived(
		newName.trim().length > 0 &&
		courses.some((c) => c.name.toLowerCase() === newName.trim().toLowerCase())
	);

	const selectedName = $derived(
		courses.find((c) => c.id === value)?.name ?? 'No course'
	);

	function select(id: string) {
		onchange?.(id);
		open = false;
	}

	async function handleCreate() {
		if (!newName.trim() || creating || isDuplicate) return;
		creating = true;
		try {
			const course = await createCourse(pb as any, { name: newName.trim() });
			oncreated?.(course as unknown as CoursesRecord);
			onchange?.(course.id);
			newName = '';
			open = false;
		} finally {
			creating = false;
		}
	}

	function handleClickOutside(e: MouseEvent) {
		if (open && wrapEl && !wrapEl.contains(e.target as Node)) {
			open = false;
		}
	}
</script>

<svelte:window onclick={handleClickOutside} />

<div class="cs-wrap" bind:this={wrapEl}>
	<button
		type="button"
		class="cs-trigger"
		class:cs-trigger--open={open}
		onclick={() => (open = !open)}
	>
		<span class="cs-trigger__label">{selectedName}</span>
		<svg class="cs-trigger__chevron" class:cs-trigger__chevron--open={open} width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
			<polyline points="6 9 12 15 18 9"/>
		</svg>
	</button>

	{#if open}
		<div class="cs-dropdown">
			<!-- Inline create at top -->
			<div class="cs-create">
				<input
					class="cs-create__input"
					class:cs-create__input--error={isDuplicate}
					type="text"
					placeholder="New course…"
					bind:value={newName}
					onkeydown={(e) => e.key === 'Enter' && handleCreate()}
					autofocus
				/>
				<button
					class="cs-create__btn"
					type="button"
					disabled={!newName.trim() || creating || isDuplicate}
					onclick={handleCreate}
					title={isDuplicate ? 'Course already exists' : 'Create course'}
				>
					{#if creating}
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
							<circle cx="12" cy="12" r="9"/>
						</svg>
					{:else}
						<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
							<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
						</svg>
					{/if}
				</button>
			</div>

			<div class="cs-divider"></div>

			<!-- Options -->
			<div class="cs-options">
				<button
					type="button"
					class="cs-option"
					class:cs-option--selected={value === ''}
					onclick={() => select('')}
				>
					No course
				</button>
				{#each courses as course (course.id)}
					<button
						type="button"
						class="cs-option"
						class:cs-option--selected={value === course.id}
						onclick={() => select(course.id)}
					>
						{course.name}
					</button>
				{/each}
			</div>
		</div>
	{/if}
</div>

<style>
	.cs-wrap {
		position: relative;
		width: 100%;
	}

	.cs-trigger {
		width: 100%;
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
		background: var(--color-surface-alt);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-sm) var(--space-md);
		color: var(--color-text-primary);
		font-size: var(--font-size-sm);
		cursor: pointer;
		text-align: left;
		transition: border-color var(--transition-fast);
	}
	.cs-trigger:hover,
	.cs-trigger--open {
		border-color: var(--color-primary);
	}
	.cs-trigger__label {
		flex: 1;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.cs-trigger__chevron {
		flex-shrink: 0;
		color: var(--color-text-secondary);
		transition: transform var(--transition-fast);
	}
	.cs-trigger__chevron--open {
		transform: rotate(180deg);
	}

	.cs-dropdown {
		position: absolute;
		top: calc(100% + 4px);
		left: 0;
		right: 0;
		z-index: 50;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		box-shadow: var(--shadow-card);
		overflow: hidden;
	}

	.cs-create {
		display: flex;
		gap: var(--space-xs);
		padding: var(--space-sm);
	}
	.cs-create__input {
		flex: 1;
		background: var(--color-surface-alt);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		padding: var(--space-xs) var(--space-sm);
		color: var(--color-text-primary);
		font-size: var(--font-size-sm);
		outline: none;
		min-width: 0;
	}
	.cs-create__input:focus {
		border-color: var(--color-primary);
	}
	.cs-create__input--error {
		border-color: var(--color-danger);
	}
	.cs-create__btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 30px;
		height: 30px;
		flex-shrink: 0;
		border-radius: var(--radius-sm);
		border: none;
		background: var(--color-primary);
		color: white;
		cursor: pointer;
		transition: opacity var(--transition-fast);
	}
	.cs-create__btn:disabled {
		opacity: 0.35;
		cursor: not-allowed;
	}

	.cs-divider {
		height: 1px;
		background: var(--color-border);
	}

	.cs-options {
		max-height: 200px;
		overflow-y: auto;
		padding: var(--space-xs);
		display: flex;
		flex-direction: column;
		gap: 1px;
	}
	.cs-option {
		width: 100%;
		text-align: left;
		padding: var(--space-sm) var(--space-md);
		border-radius: var(--radius-sm);
		border: none;
		background: none;
		color: var(--color-text-primary);
		font-size: var(--font-size-sm);
		cursor: pointer;
		transition: background var(--transition-fast);
	}
	.cs-option:hover {
		background: var(--color-surface-alt);
	}
	.cs-option--selected {
		background: var(--color-surface-alt);
		font-weight: 600;
		color: var(--color-primary);
	}
</style>
