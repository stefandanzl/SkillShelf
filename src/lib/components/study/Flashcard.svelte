<script lang="ts">
	import { marked } from 'marked';

	interface Props {
		front: string;
		back: string;
		level?: number;
		flipped?: boolean;
		starred?: boolean;
		isLast?: boolean;
		enableMarkdown?: boolean;
		onswipeleft?: () => void;
		onswiperight?: () => void;
		onswipedown?: () => void;
		onflip?: () => void;
		ontogglestar?: () => void;
	}
	let {
		front,
		back,
		level = 1,
		flipped = false,
		starred = false,
		isLast,
		enableMarkdown = true,
		onswipeleft,
		onswiperight,
		onswipedown,
		onflip,
		ontogglestar
	}: Props = $props();

	// Configure marked for safe, basic rendering
	marked.use({
		gfm: true, // GitHub Flavored Markdown
		breaks: true
	});

	const renderedFront = $derived(enableMarkdown ? marked(front) : front);
	const renderedBack = $derived(enableMarkdown ? marked(back) : back);

	let dragX = $state(0);
	let dragY = $state(0);
	let dragging = $state(false);
	let didDrag = $state(false);
	let flippedCoeff = $derived(flipped ? -1 : 1);
	let startX = 0;
	let startY = 0;
	let viewportWidth = $state(typeof window !== 'undefined' ? window.innerWidth : 400);
	let viewportHeight = $state(typeof window !== 'undefined' ? window.innerHeight : 800);

	// Responsive swipe thresholds - lower on smaller screens
	const THRESHOLD_X = $derived(Math.min(150, viewportWidth * 0.25));
	const THRESHOLD_Y = $derived(Math.min(150, viewportHeight * 0.2));
	const DRAG_TAP_THRESHOLD = 5;

	// Update viewport on resize
	if (typeof window !== 'undefined') {
		window.addEventListener('resize', () => {
			viewportWidth = window.innerWidth;
			viewportHeight = window.innerHeight;
		});
	}

	function onpointerdown(e: PointerEvent) {
		dragging = true;
		didDrag = false;
		startX = e.clientX;
		startY = e.clientY;
		(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
	}
	function onpointermove(e: PointerEvent) {
		if (!dragging) return;
		dragX = e.clientX - startX;
		dragY = e.clientY - startY;
		if (Math.abs(dragX) > DRAG_TAP_THRESHOLD || Math.abs(dragY) > DRAG_TAP_THRESHOLD) {
			didDrag = true;
		}
	}
	function onpointerup(_e: PointerEvent) {
		if (!dragging) return;
		// Check threshold
		const shouldSwipeLeft = dragX < -THRESHOLD_X;
		const shouldSwipeRight = dragX > THRESHOLD_X;
		const shouldSwipeDown = dragY > THRESHOLD_Y;

		if (shouldSwipeDown && !isLast) {
			dragging = false;
			onswipedown?.();
		} else if (shouldSwipeLeft || shouldSwipeRight) {
			// Keep dragX for smooth handoff to triggerSwipe
			dragging = false;
			if (shouldSwipeLeft) {
				onswipeleft?.();
			} else {
				onswiperight?.();
			}
		} else {
			// Below threshold - reset instantly
			dragX = 0;
			dragY = 0;
			dragging = false;
		}
	}
	function onclick() {
		if (!didDrag) {
			onflip?.();
		}
	}

	const cardBg = $derived(
		dragY > 100 ? '#3A3A3A' : dragX < -40 ? '#4A1525' : dragX > 40 ? '#1A3A4A' : 'var(--color-surface)'
	);
	const rotation = $derived(Math.max(-15, Math.min(15, dragX / 10)));

	// Expose swipe animation function - returns promise that resolves when animation completes
	let swipeAnimationEnd: (() => void) | null = null;
	let animationCompletePromise: Promise<void> | null = null;

	export function triggerSwipe(direction: 'left' | 'right' | 'down'): Promise<void> {
		const targetX = direction === 'left' ? -800 : direction === 'right' ? 800 : 0;
		const targetY = direction === 'down' ? 1500 : 0;
		const duration = 350;
		const startTime = performance.now();
		const startX_anim = dragX;
		const startY_anim = dragY;
		dragging = true;

		// Create a promise that resolves when animation completes
		animationCompletePromise = new Promise((resolve) => {
			function animate(currentTime: number) {
				const elapsed = currentTime - startTime;
				const progress = Math.min(elapsed / duration, 1);

				// Ease out cubic
				const ease = 1 - Math.pow(1 - progress, 3);
				dragX = startX_anim + (targetX - startX_anim) * ease;
				dragY = startY_anim + (targetY - startY_anim) * ease;

				if (progress < 1) {
					swipeAnimationEnd = () => {
						cancelAnimationFrame(animationId);
						requestAnimationFrame(animate);
					};
					var animationId = requestAnimationFrame(animate);
				} else {
					// Animation complete - don't reset position, card will be unmounted
					swipeAnimationEnd = null;
					dragging = false;
					if (direction === 'left') {
						onswipeleft?.();
					} else if (direction === 'right') {
						onswiperight?.();
					} else {
						onswipedown?.();
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
	{onclick}
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
			: 0}deg) translateX({dragX * flippedCoeff}px) translateY({dragY}px)"
	>
		<div class="card-face card-front">
			<button
				class="card-face__star"
				class:card-face__star--active={starred}
				onpointerdown={(e) => e.stopPropagation()}
				onclick={(e) => {
					e.stopPropagation();
					ontogglestar?.();
				}}
				aria-label="Toggle star"
			>
				<svg
					width="18"
					height="18"
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
			</button>
			<div class="card-face__content">{@html renderedFront}</div>
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
			<button
				class="card-face__star"
				class:card-face__star--active={starred}
				onpointerdown={(e) => e.stopPropagation()}
				onclick={(e) => {
					e.stopPropagation();
					ontogglestar?.();
				}}
				aria-label="Toggle star"
			>
				<svg
					width="18"
					height="18"
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
			</button>
			<div class="card-face__content">{@html renderedBack}</div>
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
		/* touch-action: pan-x pan-y pinch-zoom; */
		touch-action: none;
		overscroll-behavior: none;
		min-height: 300px;
		animation: slideUp 0.15s ease-out;
	}
	@keyframes slideUp {
		from {
			opacity: 0.5;
			transform: translateY(40px);
		}
		to {
			opacity: 1;
			transform: translateY(0);
		}
	}
	.card-container:active {
		cursor: grabbing;
	}
	.card-inner {
		position: relative;
		transform-style: preserve-3d;
		transition: background 0.2s ease;
		width: 100%;
		height: 100%;
		min-height: 300px;
		border-radius: var(--radius-lg);
	}
	.card-inner:not(.dragging) {
		transition:
			background 0.2s ease,
			transform 0.2s ease;
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
		flex-direction: column;
		align-items: center;
		justify-content: center;
		font-size: var(--font-size-md);
		color: var(--color-text-primary);
		text-align: center;
		width: 100%;
	}
	/* Markdown styles */
	.card-face__content :global(p) {
		margin: 0.5em 0;
	}
	.card-face__content :global(code) {
		background: var(--color-surface-alt);
		padding: 0.2em 0.4em;
		border-radius: 4px;
		font-family: monospace;
		font-size: 0.9em;
	}
	.card-face__content :global(pre) {
		background: var(--color-surface-alt);
		padding: var(--space-sm);
		border-radius: var(--radius-sm);
		overflow-x: auto;
		text-align: left;
	}
	.card-face__content :global(pre code) {
		background: none;
		padding: 0;
	}
	.card-face__content :global(strong) {
		font-weight: 700;
	}
	.card-face__content :global(em) {
		font-style: italic;
	}
	.card-face__content :global(ul),
	.card-face__content :global(ol) {
		text-align: left;
		padding-left: var(--space-lg);
	}
	.card-face__content :global(li) {
		margin: 0.3em 0;
	}
	.card-face__content :global(blockquote) {
		border-left: 3px solid var(--color-border);
		padding-left: var(--space-sm);
		color: var(--color-text-secondary);
		font-style: italic;
	}
	.card-face__content :global(h1),
	.card-face__content :global(h2),
	.card-face__content :global(h3),
	.card-face__content :global(h4),
	.card-face__content :global(h5),
	.card-face__content :global(h6) {
		font-weight: 700;
		margin: 0.5em 0;
		text-align: center;
	}
	.card-face__content :global(a) {
		color: var(--color-primary);
		text-decoration: underline;
	}
	.card-face__content :global(a:hover) {
		opacity: 0.8;
	}
	.card-face__content :global(img) {
		max-width: 100%;
		/* max-height: 50%; */
		object-fit: contain;
		display: block;
		/* margin: var(--space-xs) auto; */
		pointer-events: none;
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
	.card-face__star {
		position: absolute;
		top: var(--space-md);
		right: var(--space-md);
		width: 32px;
		height: 32px;
		border-radius: 50%;
		background: var(--color-surface);
		color: var(--color-text-secondary);
		border: none;
		cursor: pointer;
		display: flex;
		align-items: center;
		justify-content: center;
		transition: all 0.2s ease;
	}
	.card-face__star:hover {
		background: var(--color-surface-hover);
		color: var(--color-warning);
		transform: scale(1.1);
	}
	.card-face__star--active {
		color: var(--color-warning);
	}
	.card-face__star--active svg {
		fill: currentColor;
	}
</style>
