<script lang="ts">
	import { t } from '$lib/i18n';
	import { page } from '$app/stores';
	import { goto, invalidateAll } from '$app/navigation';
	import TopBar from '$lib/components/ui/TopBar.svelte';
	import PillButton from '$lib/components/ui/PillButton.svelte';
	import { pb } from '$lib/pocketbase.svelte';
	import { updateCard, deleteCard } from '$lib/api';

	let { data } = $props();

	const boxId = $derived($page.params.id);
	const cardId = $derived($page.params.cardId);

	let front = $derived(data.card?.front ?? '');
	let back = $derived(data.card?.back ?? '');
	const level = $derived(data.progress?.level ?? 1);

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
		<!-- Level indicator -->
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

		<div class="card-edit__field">
			<label class="card-edit__label" for="card-front">{$t('card.front_label')}</label>
			<textarea
				id="card-front"
				class="card-edit__textarea"
				placeholder={$t('card.front_placeholder')}
				bind:value={front}
				rows={5}
			></textarea>
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
			></textarea>
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
