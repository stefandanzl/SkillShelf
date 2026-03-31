<script lang="ts">
	interface Props {
		front: string;
		back: string;
		level?: number;
		flipped?: boolean;
		onswipeleft?: () => void;
		onswiperight?: () => void;
	}
	let { front, back, level = 1, flipped = false, onswipeleft, onswiperight }: Props = $props();

	let dragX = $state(0);
	let dragging = $state(false);
	let flippedCoeff = $derived(flipped ? -1 : 1);
	let startX = 0;
	const THRESHOLD = 80;

	function onpointerdown(e: PointerEvent) {
		dragging = true;
		startX = e.clientX;
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}
	function onpointermove(e: PointerEvent) {
		if (!dragging) return;
		dragX = e.clientX - startX;
	}
	function onpointerup(_e: PointerEvent) {
		if (!dragging) return;
		dragging = false;
		if (dragX < -THRESHOLD) {
			onswipeleft?.();
		} else if (dragX > THRESHOLD) {
			onswiperight?.();
		}
		dragX = 0;
	}

	const cardBg = $derived(dragX < -40 ? '#4A1525' : dragX > 40 ? '#1A3A4A' : 'var(--color-surface)');
	const rotation = $derived(Math.max(-15, Math.min(15, dragX / 10)));

	// Expose swipe animation function - returns promise that resolves when animation completes
	let swipeAnimationEnd: (() => void) | null = null;
	let animationCompletePromise: Promise<void> | null = null;
	let resolveAnimation: (() => void) | null = null;

	export function triggerSwipe(direction: 'left' | 'right'): Promise<void> {
		const targetX = direction === 'left' ? -1200 : 1200;
		const duration = 350;
		const startTime = performance.now();
		const startX_anim = dragX;
		dragging = true;

		// Create a promise that resolves when animation completes
		animationCompletePromise = new Promise((resolve) => {
			resolveAnimation = resolve;

			function animate(currentTime: number) {
				const elapsed = currentTime - startTime;
				const progress = Math.min(elapsed / duration, 1);

				// Ease out cubic
				const ease = 1 - 0.5; //Math.pow(1 - progress, 3);
				dragX = startX_anim + (targetX - startX_anim) * ease;

				if (progress < 1) {
					swipeAnimationEnd = () => {
						cancelAnimationFrame(animationId);
						requestAnimationFrame(animate);
					};
					var animationId = requestAnimationFrame(animate);
				} else {
					// Animation complete
					swipeAnimationEnd = null;
					dragging = false;
					dragX = 0;
					if (direction === 'left') {
						onswipeleft?.();
					} else {
						onswiperight?.();
					}
					resolve();
				}
			}

			// Cancel any existing animation
			if (swipeAnimationEnd) {
				swipeAnimationEnd();
			}
			requestAnimationFrame(animate);
		});

		return animationCompletePromise;
	}
</script>

<div
	class="card-container"
	{onpointerdown}
	{onpointermove}
	{onpointerup}
	role="button"
	tabindex="0"
	aria-label="Flashcard"
>
	<div
		class="card-inner"
		class:flipped
		class:dragging
		style="background: {cardBg}; transform: rotateY({flipped ? 180 : 0}deg) rotate({dragging
			? rotation * flippedCoeff
			: 0}deg) translateX({dragX * flippedCoeff}px)"
	>
		<div class="card-face card-front">
			<div class="card-face__content">{front}</div>
			<div class="card-face__footer">
				<button class="card-face__tts" aria-label="Text to speech">
					<svg
						width="22"
						height="22"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
						<path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
					</svg>
				</button>
				<span class="card-face__level">Level {level}</span>
			</div>
		</div>
		<div class="card-face card-back">
			<div class="card-face__content">{back}</div>
			<div class="card-face__footer">
				<button class="card-face__tts" aria-label="Text to speech">
					<svg
						width="22"
						height="22"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"></polygon>
						<path d="M15.54 8.46a5 5 0 0 1 0 7.07"></path>
					</svg>
				</button>
				<span class="card-face__level">Level {level}</span>
			</div>
		</div>
	</div>
</div>

<style>
	.card-container {
		perspective: 1000px;
		flex: 1;
		margin: 0 var(--space-md);
		cursor: grab;
		user-select: none;
		touch-action: pan-y;
		min-height: 300px;
	}
	.card-container:active {
		cursor: grabbing;
	}
	.card-inner {
		position: relative;
		transform-style: preserve-3d;
		transition:
			background 0.2s ease,
			transform 0.2s ease;
		width: 100%;
		height: 100%;
		min-height: 300px;
		border-radius: var(--radius-lg);
	}
	.card-face {
		position: absolute;
		inset: 0;
		border-radius: var(--radius-lg);
		backface-visibility: hidden;
		-webkit-backface-visibility: hidden;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		padding: var(--space-lg);
	}
	.card-front {
		background: inherit;
	}
	.card-back {
		transform: rotateY(180deg);
		background: inherit;
	}
	.card-face__content {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		font-size: var(--font-size-md);
		color: var(--color-text-primary);
		text-align: center;
		width: 100%;
	}
	.card-face__footer {
		display: flex;
		align-items: center;
		justify-content: space-between;
		width: 100%;
	}
	.card-face__tts {
		color: var(--color-text-secondary);
	}
	.card-face__level {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
	}
</style>
