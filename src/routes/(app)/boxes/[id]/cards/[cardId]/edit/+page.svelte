<script lang="ts">
	import { t } from '$lib/i18n';
	import { page } from '$app/stores';
	import { goto, invalidateAll } from '$app/navigation';
	import TopBar from '$lib/components/ui/TopBar.svelte';
	import PillButton from '$lib/components/ui/PillButton.svelte';
	import { pb } from '$lib/pocketbase.svelte';
	import { updateCard, deleteCard } from '$lib/api';
	import { marked } from 'marked';

	let { data } = $props();

	const boxId = $derived($page.params.id);
	const cardId = $derived($page.params.cardId);

	let front = $derived(data.card?.front ?? '');
	let back = $derived(data.card?.back ?? '');
	const level = $derived(data.progress?.level ?? 1);
	let starred = $state(false);
	$effect(() => {
		starred = data.progress?.starred ?? false;
	});

	// Load user markdown setting
	interface UserSettings {
		enableMarkdown?: boolean;
	}
	const user = $derived(pb.authStore.model as any);
	const enableMarkdown = $derived((user?.settings as UserSettings)?.enableMarkdown ?? true);

	// Configure marked
	marked.use({
		gfm: true,
		breaks: true
	});

	const renderedFront = $derived(enableMarkdown ? marked(front) : front);
	const renderedBack = $derived(enableMarkdown ? marked(back) : back);

	const canSave = $derived(front.trim().length > 0 && back.trim().length > 0);
	let showDeleteConfirm = $state(false);
	let saving = $state(false);
	let saveError = $state('');

	async function handleSave() {
		if (!canSave || saving) return;
		saving = true;
		saveError = '';
		try {
			await updateCard(pb as any, cardId, { front: front.trim(), back: back.trim() });
			// Persist starred state
			if (data.progress) {
				await pb.collection('card_progress').update(data.progress.id, { starred });
			} else if (starred) {
				const userId = pb.authStore.record?.id;
				await pb.collection('card_progress').create({
					user: userId,
					card: cardId,
					box: boxId,
					level: 1,
					starred: true,
					streak: 0
				});
			}
			await invalidateAll();
			goto(`/boxes/${boxId}`);
		} catch (e: any) {
			saveError = e?.message ?? 'Failed to save card';
			saving = false;
		}
	}

	async function handleDelete() {
		if (!showDeleteConfirm) {
			showDeleteConfirm = true;
			return;
		}
		try {
			await deleteCard(pb as any, cardId);
			await invalidateAll();
			goto(`/boxes/${boxId}`);
		} catch (e: any) {
			saveError = e?.message ?? 'Failed to delete card';
			showDeleteConfirm = false;
		}
	}
</script>

<div class="card-edit">
	<TopBar showBack title={$t('card.edit_title')} onback={() => goto(`/boxes/${boxId}`)}>
		{#snippet right()}
			<button class="save-btn" class:save-btn--active={canSave} onclick={handleSave} disabled={!canSave}>
				{$t('common.save')}
			</button>
		{/snippet}
	</TopBar>

	<div class="card-edit__form">
		<!-- Level & star indicator -->
		<div class="card-edit__meta">
			<div class="card-edit__level">
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"></path>
					<polyline points="22 4 12 14.01 9 11.01"></polyline>
				</svg>
				<span>{$t('card.level_prefix')} {level}</span>
			</div>
			<button class="card-edit__star" class:card-edit__star--active={starred} onclick={() => (starred = !starred)}>
				<svg
					width="16"
					height="16"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<polygon
						points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"
					></polygon>
				</svg>
				<span>{starred ? 'Starred' : 'Star'}</span>
			</button>
		</div>

		<div class="card-edit__field">
			<label class="card-edit__label" for="card-front">{$t('card.front_label')}</label>
			<textarea
				id="card-front"
				class="card-edit__textarea"
				placeholder={$t('card.front_placeholder')}
				bind:value={front}
				rows={5}
			>
			</textarea>
			{#if enableMarkdown}
				<div class="card-edit__preview">
					<div class="card-edit__preview-label">Preview</div>
					<div class="card-edit__preview-content">{@html renderedFront}</div>
				</div>
			{/if}
		</div>

		<div class="card-edit__divider">
			<div class="card-edit__divider-line"></div>
			<svg
				width="24"
				height="24"
				viewBox="0 0 24 24"
				fill="none"
				stroke="var(--color-text-secondary)"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<polyline points="7 10 12 15 17 10"></polyline>
			</svg>
			<div class="card-edit__divider-line"></div>
		</div>

		<div class="card-edit__field">
			<label class="card-edit__label" for="card-back">{$t('card.back_label')}</label>
			<textarea
				id="card-back"
				class="card-edit__textarea"
				placeholder={$t('card.back_placeholder')}
				bind:value={back}
				rows={5}
			>
			</textarea>
			{#if enableMarkdown}
				<div class="card-edit__preview">
					<div class="card-edit__preview-label">Preview</div>
					<div class="card-edit__preview-content">{@html renderedBack}</div>
				</div>
			{/if}
		</div>

		{#if saveError}<p class="card-edit__error">{saveError}</p>{/if}
		<PillButton onclick={handleSave} disabled={!canSave || saving}>
			{saving ? 'Saving…' : $t('common.save')}
		</PillButton>

		<PillButton variant={showDeleteConfirm ? 'danger-fill' : 'danger-outline'} onclick={handleDelete}>
			{showDeleteConfirm ? $t('common.confirm') : $t('card.delete_button')}
		</PillButton>

		{#if showDeleteConfirm}
			<button class="card-edit__cancel" onclick={() => (showDeleteConfirm = false)}>
				{$t('common.cancel')}
			</button>
		{/if}
	</div>
</div>

<style>
	.card-edit {
		display: flex;
		flex-direction: column;
		min-height: 100%;
	}
	.card-edit__form {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		padding: 0 var(--space-md) var(--space-xl);
	}
	.card-edit__meta {
		display: flex;
		align-items: center;
		justify-content: space-between;
		gap: var(--space-sm);
	}
	.card-edit__level {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		background: var(--color-surface);
		border-radius: var(--radius-md);
		padding: var(--space-sm) var(--space-md);
	}
	.card-edit__star {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		background: var(--color-surface);
		border-radius: var(--radius-md);
		padding: var(--space-sm) var(--space-md);
		cursor: pointer;
		transition: all var(--transition-fast);
	}
	.card-edit__star--active {
		color: var(--color-warning);
	}
	.card-edit__star--active svg {
		fill: currentColor;
	}
	.card-edit__field {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}
	.card-edit__label {
		font-size: var(--font-size-sm);
		font-weight: 600;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.card-edit__textarea {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-md);
		color: var(--color-text-primary);
		resize: vertical;
		width: 100%;
		line-height: 1.5;
	}
	.card-edit__textarea:focus {
		border-color: var(--color-primary);
		outline: none;
	}
	.card-edit__preview {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-md);
		margin-top: var(--space-xs);
	}
	.card-edit__preview-label {
		font-size: var(--font-size-xs);
		font-weight: 600;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin-bottom: var(--space-xs);
	}
	.card-edit__preview-content {
		font-size: var(--font-size-md);
		color: var(--color-text-primary);
		line-height: 1.5;
		/* Markdown styles matching flashcard */
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		min-height: 80px;
	}
	.card-edit__preview-content :global(p) {
		margin: 0.5em 0;
	}
	.card-edit__preview-content :global(code) {
		background: var(--color-surface-alt);
		padding: 0.2em 0.4em;
		border-radius: 4px;
		font-family: monospace;
		font-size: 0.9em;
	}
	.card-edit__preview-content :global(pre) {
		background: var(--color-surface-alt);
		padding: var(--space-sm);
		border-radius: var(--radius-sm);
		overflow-x: auto;
		text-align: left;
	}
	.card-edit__preview-content :global(pre code) {
		background: none;
		padding: 0;
	}
	.card-edit__preview-content :global(strong) {
		font-weight: 700;
	}
	.card-edit__preview-content :global(em) {
		font-style: italic;
	}
	.card-edit__preview-content :global(ul),
	.card-edit__preview-content :global(ol) {
		text-align: left;
		padding-left: var(--space-lg);
	}
	.card-edit__preview-content :global(li) {
		margin: 0.3em 0;
	}
	.card-edit__preview-content :global(blockquote) {
		border-left: 3px solid var(--color-border);
		padding-left: var(--space-sm);
		color: var(--color-text-secondary);
		font-style: italic;
	}
	.card-edit__preview-content :global(h1),
	.card-edit__preview-content :global(h2),
	.card-edit__preview-content :global(h3),
	.card-edit__preview-content :global(h4),
	.card-edit__preview-content :global(h5),
	.card-edit__preview-content :global(h6) {
		font-weight: 700;
		margin: 0.5em 0;
		text-align: center;
	}
	.card-edit__preview-content :global(a) {
		color: var(--color-primary);
		text-decoration: underline;
	}
	.card-edit__preview-content :global(img) {
		max-width: 100%;
		display: block;
		margin: var(--space-xs) auto;
		pointer-events: none;
	}
	.card-edit__divider {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}
	.card-edit__divider-line {
		flex: 1;
		height: 1px;
		background: var(--color-border);
	}
	.card-edit__cancel {
		font-size: var(--font-size-base);
		color: var(--color-text-secondary);
		text-align: center;
		padding: var(--space-sm);
		width: 100%;
	}
	.save-btn {
		font-size: var(--font-size-base);
		font-weight: 600;
		color: var(--color-text-disabled);
		padding: var(--space-xs) var(--space-sm);
		transition: color var(--transition-fast);
	}
	.save-btn--active {
		color: var(--color-primary);
	}
	.save-btn:disabled {
		cursor: not-allowed;
	}
	.card-edit__error {
		font-size: var(--font-size-sm);
		color: var(--color-danger);
		margin: 0;
	}
</style>
