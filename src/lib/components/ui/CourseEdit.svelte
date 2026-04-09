<script lang="ts">
	import { pb } from '$lib/pocketbase.svelte';
	import { invalidateAll } from '$app/navigation';
	import Sheet from './Sheet.svelte';
	import Toggle from './Toggle.svelte';
	import { updateCourse, deleteCourse } from '$lib/api';
	import type { CoursesRecord } from '$lib/pocketbase-types';

	interface Props {
		open: boolean;
		course: CoursesRecord;
		onclose: () => void;
		ondeleted?: () => void;
		onupdated?: (course: CoursesRecord) => void;
	}

	let { open, course, onclose, ondeleted, onupdated }: Props = $props();

	// Form state
	let name = $state(course.name);
	let color = $state(course.color ?? '');
	let archived = $state(course.archived ?? false);
	let customColor = $state('');
	let showColorPicker = $state(false);

	// Preset colors matching app.css
	const presetColors = [
		'#F06292', // red
		'#5BABF5', // blue
		'#66BB6A', // green
		'#FFA726', // orange
		'#AB47BC', // purple
		'#26C6DA'  // teal
	] as const;

	let saving = $state(false);
	let deleting = $state(false);
	let error = $state('');

	async function handleSave() {
		if (!name.trim() || saving) return;
		saving = true;
		error = '';
		try {
			const finalColor = customColor || color;
			const updated = await updateCourse(pb as any, course.id, {
				name: name.trim(),
				color: finalColor,
				archived
			});
			onupdated?.(updated as unknown as CoursesRecord);
			onclose();
			await invalidateAll();
		} catch (e: any) {
			error = e?.message ?? 'Failed to update course';
		} finally {
			saving = false;
		}
	}

	async function handleDelete() {
		if (!confirm('Delete this course? Boxes in this course will become uncategorized (not deleted).')) return;
		deleting = true;
		try {
			await deleteCourse(pb as any, course.id);
			ondeleted?.();
			onclose();
			await invalidateAll();
		} catch (e: any) {
			error = e?.message ?? 'Failed to delete course';
		} finally {
			deleting = false;
		}
	}

	function selectColor(hex: string) {
		color = hex;
		customColor = '';
		showColorPicker = false;
	}
</script>

<Sheet open={open} onclose={onclose} title="Edit course">
	{#snippet children()}
		<div class="course-edit">
			<div class="course-edit__field">
				<label class="course-edit__label" for="course-name">Name</label>
				<input
					id="course-name"
					class="course-edit__input"
					type="text"
					bind:value={name}
					placeholder="Course name"
					maxlength={80}
				/>
				<div class="course-edit__char-count">{name.length}/80</div>
			</div>

			<div class="course-edit__field">
				<label class="course-edit__label">Color</label>
				<div class="course-edit__colors">
					{#each presetColors as presetColor}
						<button
							class="color-dot"
							class:color-dot--active={color === presetColor && !customColor}
							style="background: {presetColor}"
							onclick={() => selectColor(presetColor)}
							aria-label={presetColor}
						></button>
					{/each}
					<button
						class="color-dot color-dot--custom"
						class:color-dot--active={!!customColor}
						style="background: {customColor || color || '#666'}"
						onclick={() => showColorPicker = !showColorPicker}
						aria-label="Custom color"
					>
						{#if !customColor}
							<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
								<circle cx="12" cy="12" r="10"/><path d="M12 8v8M8 12h8"/>
							</svg>
						{/if}
					</button>
				</div>
				{#if showColorPicker}
					<div class="course-edit__custom-color">
						<input
							type="color"
							bind:value={customColor}
							oninput={() => color = ''}
						/>
						<input
							class="course-edit__hex-input"
							type="text"
							bind:value={customColor}
							placeholder="#000000"
							maxlength={7}
						/>
					</div>
				{/if}
			</div>

			<div class="course-edit__field">
				<div class="course-edit__row">
					<div class="course-edit__row-left">
						<span class="course-edit__label">Archived</span>
						<span class="course-edit__hint">Hide from main view</span>
					</div>
					<Toggle checked={archived} onchange={(v) => archived = v} />
				</div>
			</div>

			{#if error}<p class="course-edit__error">{error}</p>{/if}

			<div class="course-edit__actions">
				<button
					class="course-edit__delete"
					onclick={handleDelete}
					disabled={deleting}
					type="button"
				>
					{deleting ? 'Deleting...' : 'Delete course'}
				</button>
				<button
					class="course-edit__save"
					onclick={handleSave}
					disabled={!name.trim() || saving}
					type="button"
				>
					{saving ? 'Saving...' : 'Save changes'}
				</button>
			</div>
		</div>
	{/snippet}
</Sheet>

<style>
	.course-edit {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}

	.course-edit__field {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}

	.course-edit__label {
		font-size: var(--font-size-sm);
		font-weight: 600;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}

	.course-edit__hint {
		font-size: var(--font-size-xs);
		color: var(--color-text-secondary);
		text-transform: none;
		letter-spacing: normal;
	}

	.course-edit__input {
		background: var(--color-surface-alt);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-md);
		color: var(--color-text-primary);
		width: 100%;
		outline: none;
	}

	.course-edit__input:focus {
		border-color: var(--color-primary);
	}

	.course-edit__char-count {
		font-size: var(--font-size-xs);
		color: var(--color-text-secondary);
		text-align: right;
	}

	.course-edit__colors {
		display: flex;
		gap: var(--space-sm);
		flex-wrap: wrap;
	}

	.color-dot {
		width: 36px;
		height: 36px;
		border-radius: 50%;
		border: 3px solid transparent;
		transition: border-color var(--transition-fast);
		display: flex;
		align-items: center;
		justify-content: center;
		color: white;
		cursor: pointer;
	}

	.color-dot--active {
		border-color: white;
		box-shadow: 0 0 0 2px var(--color-primary);
	}

	.color-dot--custom {
		background: #333 !important;
	}

	.course-edit__custom-color {
		display: flex;
		gap: var(--space-sm);
		align-items: center;
		margin-top: var(--space-xs);
	}

	.course-edit__custom-color input[type="color"] {
		width: 40px;
		height: 40px;
		border: none;
		border-radius: var(--radius-sm);
		cursor: pointer;
		padding: 0;
	}

	.course-edit__hex-input {
		flex: 1;
		background: var(--color-surface-alt);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		padding: var(--space-xs) var(--space-sm);
		color: var(--color-text-primary);
		font-family: monospace;
		outline: none;
	}

	.course-edit__hex-input:focus {
		border-color: var(--color-primary);
	}

	.course-edit__row {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}

	.course-edit__row-left {
		display: flex;
		flex-direction: column;
		gap: 2px;
	}

	.course-edit__error {
		font-size: var(--font-size-sm);
		color: var(--color-danger);
		margin: 0;
	}

	.course-edit__actions {
		display: flex;
		gap: var(--space-sm);
		margin-top: var(--space-sm);
	}

	.course-edit__delete {
		flex: 1;
		padding: var(--space-md);
		border-radius: var(--radius-md);
		border: 1px solid var(--color-danger);
		background: transparent;
		color: var(--color-danger);
		font-weight: 600;
		cursor: pointer;
		transition: opacity var(--transition-fast);
	}

	.course-edit__delete:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}

	.course-edit__save {
		flex: 2;
		padding: var(--space-md);
		border-radius: var(--radius-md);
		border: none;
		background: var(--color-primary);
		color: white;
		font-weight: 600;
		cursor: pointer;
		transition: opacity var(--transition-fast);
	}

	.course-edit__save:disabled {
		opacity: 0.5;
		cursor: not-allowed;
	}
</style>
