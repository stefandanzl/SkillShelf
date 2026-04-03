<script lang="ts">
	import { t } from '$lib/i18n';
	import { page } from '$app/stores';
	import { goto, invalidateAll } from '$app/navigation';
	import { onMount } from 'svelte';
	import TopBar from '$lib/components/ui/TopBar.svelte';
	import IconButton from '$lib/components/ui/IconButton.svelte';
	import ProgressBar from '$lib/components/ui/ProgressBar.svelte';
	import PillButton from '$lib/components/ui/PillButton.svelte';
	import Flashcard from '$lib/components/study/Flashcard.svelte';
	import { pb } from '$lib/pocketbase.svelte';
	import { submitAnswer } from '$lib/api';
	import { registerHotkey, formatBinding, loadUserHotkeys } from '$lib/hotkeys';
	// import type { Card, CardProgress } from '$lib/types';
	import type { CardsRecord, CardProgressRecord } from '$lib/pocketbase-types.js';

	let { data } = $props();

	const boxId = $derived($page.params.id);

	// Get user from pb auth store
	const user = $derived(pb.authStore.model as any);

	// User settings
	interface UserSettings {
		showStudyButtons?: boolean;
		enableMarkdown?: boolean;
		language?: string;
	}

	// Load settings from user
	let showButtons = $state(true);
	let enableMarkdown = $state(true);
	$effect(() => {
		if (user?.settings) {
			showButtons = user.settings.showStudyButtons ?? true;
			enableMarkdown = user.settings.enableMarkdown ?? true;
		}
	});

	// Save settings to user
	async function saveSetting<K extends keyof UserSettings>(key: K, value: UserSettings[K]) {
		if (!user) return;
		const currentSettings = (user.settings || {}) as UserSettings;
		const updatedSettings = { ...currentSettings, [key]: value };
		await pb.collection('users').update(user.id, { settings: updatedSettings });
	}

	async function toggleShowButtons() {
		showButtons = !showButtons;
		await saveSetting('showStudyButtons', showButtons);
	}

	// dueCards: Array<{ card: Card; progress: CardProgress | null }>
	const dueCards = $derived(data.dueCards ?? []);

	// Mutable queue for skip functionality
	let queue = $state<{ card: CardsRecord; progress: CardProgressRecord | null }[]>([]);
	let currentIndex = $state(0);
	let flipped = $state(false);
	let showResult = $state(false);
	let done = $state(false);
	let submitting = $state(false);
	let flashcardRef: { triggerSwipe: (direction: 'left' | 'right' | 'down') => Promise<void> } | null = $state(null);
	let starredOverrides = $state<Record<string, boolean>>({});

	// Initialize queue from dueCards
	$effect(() => {
		queue = [...dueCards];
	});

	const currentEntry = $derived(
		queue[currentIndex] as { card: CardsRecord; progress: CardProgressRecord | null } | undefined
	);
	const currentCard = $derived(currentEntry?.card);
	const currentProgress = $derived(currentEntry?.progress ?? null);
	const currentStarred = $derived(
		currentCard && currentCard.id in starredOverrides
			? starredOverrides[currentCard.id]
			: (currentProgress?.starred ?? false)
	);
	const progressPct = $derived(queue.length > 0 ? (currentIndex / queue.length) * 100 : 0);
	const isLast = $derived(currentIndex >= queue.length - 1);

	function showAnswer() {
		flipped = true;
		showResult = true;
	}

	function toggleFlip() {
		if (done) return;
		// If showing result, flip back to front; otherwise show answer
		if (showResult) {
			showResult = false;
			flipped = false; // Also flip the card back to front
		} else {
			showAnswer();
		}
	}

	function toggleStar() {
		if (!currentCard) return;
		const cardId = currentCard.id;
		const newStarredValue = !currentStarred;
		starredOverrides = { ...starredOverrides, [cardId]: newStarredValue };
	}

	async function handleAnswer(wasCorrect: boolean, skipAnimation = false) {
		if (!currentCard || submitting) return;
		submitting = true;

		// Start swipe animation and API request in parallel for faster feel
		let animationPromise: Promise<void> | null = null;
		if (!skipAnimation && flashcardRef) {
			const direction = wasCorrect ? 'right' : 'left';
			animationPromise = flashcardRef.triggerSwipe(direction);
		}

		// Submit answer immediately (don't wait for animation)
		try {
			const starOverride = currentCard.id in starredOverrides ? starredOverrides[currentCard.id] : undefined;
			await submitAnswer(pb as any, currentCard, currentProgress, wasCorrect, starOverride);
		} catch (e) {
			console.error('Failed to submit answer', e);
		}

		// Wait for animation to complete before showing next card
		if (animationPromise) {
			await animationPromise;
		}

		submitting = false;
		nextCard();
	}

	async function handleSkip() {
		if (!currentCard || submitting || isLast) return;
		submitting = true;

		// Start swipe animation
		const animationPromise = flashcardRef?.triggerSwipe('down') ?? Promise.resolve();

		// Move current card to the back of the queue immediately
		const currentEntry = queue[currentIndex];
		queue = queue.filter((_, i) => i !== currentIndex);
		queue.push(currentEntry);

		// Wait for animation to complete before resetting state
		await animationPromise;

		flipped = false;
		showResult = false;
		submitting = false;
		// Don't increment currentIndex since we removed the current element
	}

	function nextCard() {
		if (isLast) {
			done = true;
			return;
		}
		currentIndex += 1;
		flipped = false;
		showResult = false;
	}

	async function finishSession() {
		await invalidateAll();
		goto(`/boxes/${boxId}`);
	}

	// Register hotkeys on mount
	onMount(() => {
		// Load user's custom hotkeys first
		const user = pb.authStore.record as any;
		if (user?.hotkeys) {
			loadUserHotkeys(user.hotkeys);
		}

		const unsubscribes = [
			// Flip card / toggle (Space, Enter) - works anytime
			registerHotkey(
				'study.flip_card',
				() => {
					toggleFlip();
				},
				() => !done
			),

			// Answer: Wrong (A)
			registerHotkey(
				'study.answer_wrong',
				() => {
					handleAnswer(false);
				},
				() => !done
			),

			// Answer: Correct (D)
			registerHotkey(
				'study.answer_correct',
				() => {
					handleAnswer(true);
				},
				() => !done
			),

			// Answer: Skip (S)
			registerHotkey(
				'study.answer_skip',
				() => {
					if (!done) {
						handleSkip();
					}
				},
				() => !done && !isLast
			),

			// Next card (N)
			registerHotkey('study.next_card', () => {
				if (!isLast && !done) {
					nextCard();
				}
			}),

			// Previous card (P)
			registerHotkey('study.previous_card', () => {
				if (currentIndex > 0 && !done) {
					currentIndex -= 1;
					flipped = false;
					showResult = false;
				}
			})
		];

		return () => {
			unsubscribes.forEach((fn) => fn());
		};
	});

	async function handleSwipeLeft() {
		// if (!showResult) return;
		await handleAnswer(false, false);
	}

	async function handleSwipeRight() {
		// if (!showResult) return;
		await handleAnswer(true, false);
	}

	async function handleSwipeDown() {
		// if (!showResult) return;
		await handleSkip();
	}
</script>

{#if done || queue.length === 0}
	<div class="study study--done">
		<TopBar showBack onback={() => goto(`/boxes/${boxId}`)}>
			{#snippet center()}
				<span class="study__counter">Done!</span>
			{/snippet}
		</TopBar>
		<div class="study__done-content">
			<div class="study__done-icon">
				<svg
					width="64"
					height="64"
					viewBox="0 0 24 24"
					fill="none"
					stroke="var(--color-success, var(--color-primary))"
					stroke-width="2"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<polyline points="20 6 9 17 4 12"></polyline>
				</svg>
			</div>
			<h2 class="study__done-title">
				{queue.length === 0 ? 'No cards due today!' : 'Session complete!'}
			</h2>
			<p class="study__done-subtitle">
				{queue.length === 0 ? 'All caught up.' : `You reviewed ${queue.length} card${queue.length === 1 ? '' : 's'}.`}
			</p>
			<PillButton onclick={finishSession}>Back to Box</PillButton>
		</div>
	</div>
{:else}
	<div class="study">
		<TopBar showBack onback={() => goto(`/boxes/${boxId}`)}>
			{#snippet center()}
				<span class="study__counter">
					{currentIndex + 1}/{queue.length}
				</span>
			{/snippet}
			{#snippet right()}
				<IconButton title="Card grid" onclick={toggleShowButtons}>
					<svg
						width="20"
						height="20"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect><rect
							x="3"
							y="14"
							width="7"
							height="7"
						></rect><rect x="14" y="14" width="7" height="7"></rect>
					</svg>
				</IconButton>
			{/snippet}
		</TopBar>

		<ProgressBar value={progressPct} />

		<div class="study__card-area" onfocus={(e) => e.currentTarget?.blur()}>
			{#if currentCard}
				{#key currentCard.id}
					<Flashcard
						bind:this={flashcardRef}
						front={currentCard.front}
						back={currentCard.back}
						level={currentProgress?.level ?? 1}
						starred={currentStarred}
						{flipped}
						{isLast}
						{enableMarkdown}
						onswipeleft={handleSwipeLeft}
						onswiperight={handleSwipeRight}
						onswipedown={handleSwipeDown}
						onflip={toggleFlip}
						ontogglestar={toggleStar}
					/>
				{/key}
			{/if}
		</div>

		<div class="study__actions {showButtons ? '' : 'hidden'}">
			{#if !showResult}
				<PillButton
					onclick={() => {
						showAnswer();
					}}
				>
					{$t('study.show_answer')}
					<span class="study__key-hint">Space</span>
				</PillButton>
			{:else}
				<div class="study__result-buttons">
					<PillButton
						variant="danger-outline"
						onclick={() => {
							handleAnswer(false);
						}}
						fullWidth={false}
						width="calc(33.33% - 8px)"
						disabled={submitting}
					>
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
							<line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line>
						</svg>
						<span>Wrong</span>
						<span class="study__key-hint">A</span>
					</PillButton>
					<PillButton
						variant="secondary"
						onclick={() => {
							console.log(queue.length);
							handleSkip();
						}}
						fullWidth={false}
						width="calc(33.33% - 8px)"
						disabled={submitting || isLast}
					>
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
							<line x1="5" y1="12" x2="19" y2="12"></line>
						</svg>
						<span>Skip</span>
						<span class="study__key-hint">S</span>
					</PillButton>
					<PillButton
						onclick={() => {
							handleAnswer(true);
						}}
						fullWidth={false}
						width="calc(33.33% - 8px)"
						disabled={submitting}
					>
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
							<polyline points="20 6 9 17 4 12"></polyline>
						</svg>
						<span>Correct</span>
						<span class="study__key-hint">D</span>
					</PillButton>
				</div>
			{/if}
		</div>
	</div>
{/if}

<style>
	.study {
		display: flex;
		flex-direction: column;
		height: 100dvh;
		overflow: hidden;
		overscroll-behavior-y: none;
		touch-action: pan-x pan-y pinch-zoom;
	}

	.study--done {
		overflow: auto;
	}

	.study__card-area {
		flex: 1;
		display: flex;
		flex-direction: column;
		padding: var(--space-md);
		min-height: 0;
		/* user-select: none;
		-webkit-user-select: none; */
	}
	/*
  .study__card-area :global(*) {
    user-select: none;
    -webkit-user-select: none;
  } */

	.study__card-area :global(*:focus) {
		outline: none !important;
	}

	.study__card-area :global(*:focus-visible) {
		outline: none !important;
	}

	.study__counter {
		font-size: var(--font-size-base);
		font-weight: 600;
		color: var(--color-text-primary);
	}

	.study__actions {
		padding: var(--space-md);
		padding-bottom: calc(var(--space-md) + env(safe-area-inset-bottom, 0px));
	}

	.study__result-buttons {
		display: flex;
		gap: 12px;
	}

	.study__key-hint {
		font-size: var(--font-size-xs);
		padding: 2px 6px;
		background: var(--color-surface-alt);
		border-radius: 4px;
		color: var(--color-text-secondary);
		margin-left: var(--space-xs);
		display: none;
	}

	.study__done-content {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-md);
		padding: var(--space-xl) var(--space-md);
		flex: 1;
	}

	.study__done-icon {
		width: 96px;
		height: 96px;
		border-radius: 50%;
		background: var(--color-surface);
		display: flex;
		align-items: center;
		justify-content: center;
	}

	.study__done-title {
		font-size: var(--font-size-xl);
		font-weight: 700;
		color: var(--color-text-primary);
		margin: 0;
		text-align: center;
	}

	.study__done-subtitle {
		font-size: var(--font-size-base);
		color: var(--color-text-secondary);
		margin: 0;
		text-align: center;
	}

	.hidden {
		display: none;
	}
</style>
