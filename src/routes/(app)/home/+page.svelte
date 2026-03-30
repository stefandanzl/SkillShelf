<script lang="ts">
	import { t } from '$lib/i18n';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import IconButton from '$lib/components/ui/IconButton.svelte';
	import CircularProgress from '$lib/components/ui/CircularProgress.svelte';
	import Sheet from '$lib/components/ui/Sheet.svelte';
	import SegmentedControl from '$lib/components/ui/SegmentedControl.svelte';
	import PillButton from '$lib/components/ui/PillButton.svelte';
	import { goto, invalidateAll } from '$app/navigation';
	import { pb } from '$lib/pocketbase.svelte';
	import { createBox } from '$lib/api';
	import { BOX_COLOR_MAP } from '$lib/leitner';
	import { BoxesColorOptions, BoxesLearnDirectionOptions } from '$lib/pocketbase-types';

	let { data } = $props();

	let showCreateBox = $state(false);
	let createTab = $state('manual');
	let newBoxName = $state('');
	let selectedColor = $state<BoxesColorOptions>(BoxesColorOptions.blue);
	let creating = $state(false);
	let createError = $state('');

	const createTabs = $derived([
		{ value: 'manual', label: $t('box.tab_manual') },
		{ value: 'ai', label: $t('box.tab_ai') },
		{ value: 'import', label: $t('box.tab_import') }
	]);

	const username = $derived(
		(pb.authStore.record as any)?.name ||
			(pb.authStore.record as any)?.email ||
			data?.user?.name ||
			data?.user?.email ||
			'User'
	);

	const boxColors: BoxesColorOptions[] = Object.values(BoxesColorOptions);

	const totalDue = $derived((data.boxSummaries ?? []).reduce((s: number, b: any) => s + b.dueCount, 0));

	async function handleAddBox() {
		if (!newBoxName.trim()) return;
		creating = true;
		createError = '';
		try {
			await createBox(pb as any, {
				name: newBoxName.trim(),
				color: selectedColor,
				learn_direction: BoxesLearnDirectionOptions.front_to_back
			});
			showCreateBox = false;
			newBoxName = '';
			await invalidateAll();
		} catch (e: any) {
			createError = e?.message ?? 'Failed to create box';
		} finally {
			creating = false;
		}
	}
</script>

<div class="home">
	<header class="home__header">
		<div class="home__user">
			<Avatar name={username} size={40} />
			<div class="home__user-text">
				<span class="home__greeting">{$t('home.greeting')}</span>
				<span class="home__username">{username}</span>
			</div>
		</div>
		<IconButton onclick={() => (showCreateBox = true)} title={$t('box.add_title')}>
			<svg
				width="20"
				height="20"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2.5"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
			</svg>
		</IconButton>
	</header>

	<p class="home__status">
		{totalDue === 0 ? $t('home.no_cards_due') : `${totalDue} cards due today`}
	</p>

	<div class="home__boxes">
		{#each data.boxSummaries ?? [] as summary (summary.box.id)}
			<button class="topic-card" onclick={() => goto(`/boxes/${summary.box.id}`)}>
				<div
					class="topic-card__accent"
					style="background: {BOX_COLOR_MAP[summary.box.color] ?? 'var(--color-primary)'}"
				></div>
				<div class="topic-card__body">
					<div class="topic-card__top">
						<span class="topic-card__name">{summary.box.name}</span>
						<CircularProgress
							value={summary.completionPct}
							size={44}
							color={BOX_COLOR_MAP[summary.box.color] ?? 'var(--color-primary)'}
						/>
					</div>
					<div class="topic-card__bottom">
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
							<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
							<polyline points="14 2 14 8 20 8"></polyline>
						</svg>
						<span class="topic-card__count">
							{summary.totalCards} /
							<span class="topic-card__due" class:topic-card__due--active={summary.dueCount > 0}
								>{summary.dueCount}</span
							>
						</span>
					</div>
				</div>
			</button>
		{/each}

		{#if (data.boxSummaries ?? []).length === 0}
			<div class="home__empty">
				<p>No boxes yet. Tap + to create your first one!</p>
			</div>
		{/if}
	</div>
</div>

<Sheet open={showCreateBox} title={$t('box.add_title')} onclose={() => (showCreateBox = false)}>
	{#snippet children()}
		<div class="create-box">
			<SegmentedControl segments={createTabs} value={createTab} onchange={(v) => (createTab = v)} />

			{#if createTab === 'manual'}
				<div class="create-box__form">
					<label class="create-box__label" for="box-name">{$t('box.name_label')}</label>
					<input
						id="box-name"
						class="create-box__input"
						type="text"
						placeholder={$t('box.name_placeholder')}
						bind:value={newBoxName}
						maxlength={80}
					/>
					<div class="create-box__char-count">{newBoxName.length}/80</div>

					<label class="create-box__label">{$t('box.color')}</label>
					<div class="color-picker">
						{#each boxColors as c}
							<button
								class="color-dot"
								class:color-dot--active={selectedColor === c}
								style="background: {BOX_COLOR_MAP[c]}"
								onclick={() => (selectedColor = c)}
								aria-label={c}
							></button>
						{/each}
					</div>
				</div>
				{#if createError}<p class="create-box__error">{createError}</p>{/if}
				<PillButton onclick={handleAddBox} disabled={!newBoxName.trim() || creating}>
					{creating ? 'Creating…' : $t('box.add_button')}
				</PillButton>
			{:else if createTab === 'ai'}
				<div class="create-box__form">
					<input class="create-box__input" type="text" placeholder={$t('box.ai_category')} />
				</div>
				<PillButton variant="disabled">{$t('box.create_with_ai')}</PillButton>
			{:else if createTab === 'import'}
				<div class="import-options">
					{#each [{ icon: '📄', key: 'csv', descKey: 'csv_desc' }, { icon: '📊', key: 'excel', descKey: 'excel_desc' }, { icon: '📦', key: 'leitner', descKey: 'leitner_desc' }] as opt}
						<button class="import-option">
							<div class="import-option__icon">{opt.icon}</div>
							<div class="import-option__info">
								<span class="import-option__title">{$t(`import.${opt.key}`)}</span>
								<span class="import-option__desc">{$t(`import.${opt.descKey}`)}</span>
							</div>
							<svg
								width="18"
								height="18"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg
							>
						</button>
					{/each}
				</div>
			{/if}
		</div>
	{/snippet}
</Sheet>

<style>
	.home {
		padding: var(--space-md);
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}
	.home__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: var(--space-sm);
	}
	.home__user {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}
	.home__user-text {
		display: flex;
		flex-direction: column;
	}
	.home__greeting {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
	}
	.home__username {
		font-size: var(--font-size-base);
		font-weight: 700;
		color: var(--color-text-primary);
	}
	.home__status {
		font-size: var(--font-size-md);
		color: var(--color-text-primary);
		margin: 0;
	}
	.home__boxes {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}
	.home__empty {
		text-align: center;
		color: var(--color-text-secondary);
		padding: var(--space-xl);
	}

	.topic-card {
		background: var(--color-surface);
		border-radius: var(--radius-lg);
		padding: var(--space-md);
		display: flex;
		align-items: stretch;
		gap: var(--space-md);
		cursor: pointer;
		transition: background var(--transition-fast);
		text-align: left;
		width: 100%;
		box-shadow: var(--shadow-card);
	}
	.topic-card:hover {
		background: var(--color-surface-alt);
	}
	.topic-card__accent {
		width: 4px;
		border-radius: 4px;
		flex-shrink: 0;
		min-height: 60px;
	}
	.topic-card__body {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}
	.topic-card__top {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.topic-card__name {
		font-size: var(--font-size-md);
		font-weight: 700;
		color: var(--color-text-primary);
	}
	.topic-card__bottom {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		color: var(--color-text-secondary);
		font-size: var(--font-size-sm);
	}
	.topic-card__count {
		color: var(--color-text-secondary);
	}
	.topic-card__due {
		color: var(--color-text-secondary);
	}
	.topic-card__due--active {
		color: var(--color-danger);
	}

	.create-box {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}
	.create-box__form {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}
	.create-box__label {
		font-size: var(--font-size-sm);
		font-weight: 600;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.create-box__input {
		background: var(--color-surface-alt);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-md);
		color: var(--color-text-primary);
		width: 100%;
	}
	.create-box__input:focus {
		border-color: var(--color-primary);
		outline: none;
	}
	.create-box__char-count {
		font-size: var(--font-size-xs);
		color: var(--color-text-secondary);
		text-align: right;
	}
	.create-box__error {
		font-size: var(--font-size-sm);
		color: var(--color-danger);
		margin: 0;
	}

	.color-picker {
		display: flex;
		gap: var(--space-sm);
		flex-wrap: wrap;
	}
	.color-dot {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		border: 3px solid transparent;
		transition: border-color var(--transition-fast);
	}
	.color-dot--active {
		border-color: white;
	}

	.import-options {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}
	.import-option {
		background: var(--color-surface-alt);
		border-radius: var(--radius-md);
		padding: var(--space-md);
		display: flex;
		align-items: center;
		gap: var(--space-md);
		width: 100%;
		text-align: left;
		cursor: pointer;
		transition: background var(--transition-fast);
		color: var(--color-text-primary);
	}
	.import-option:hover {
		background: var(--color-border);
	}
	.import-option__icon {
		font-size: 24px;
	}
	.import-option__info {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 2px;
	}
	.import-option__title {
		font-weight: 600;
		font-size: var(--font-size-base);
	}
	.import-option__desc {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
	}
</style>
