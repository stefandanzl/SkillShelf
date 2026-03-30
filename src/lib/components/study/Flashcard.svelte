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
    if (dragX < -THRESHOLD) { onswipeleft?.(); }
    else if (dragX > THRESHOLD) { onswiperight?.(); }
    dragX = 0;
  }

  const cardBg = $derived(
    dragX < -40 ? '#4A1525' :
    dragX > 40 ? '#1A3A4A' :
    flipped ? 'var(--color-surface-alt)' : 'var(--color-surface)'
  );
  const rotation = $derived(Math.max(-15, Math.min(15, dragX / 10)));
</script>

<div
  class="card-container"
  onpointerdown={onpointerdown}
  onpointermove={onpointermove}
  onpointerup={onpointerup}
  role="button"
  tabindex="0"
  aria-label="Flashcard"
>
  <div
    class="card-inner"
    class:flipped
    style="background: {cardBg}; transform: rotateY({flipped ? 180 : 0}deg) rotate({dragging ? rotation : 0}deg) translateX({dragX}px)"
  >
    <div class="card-face card-front">
      <div class="card-face__content">{front}</div>
      <div class="card-face__footer">
        <button class="card-face__tts" aria-label="Text to speech">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
          </svg>
        </button>
        <span class="card-face__level">Level {level}</span>
      </div>
    </div>
    <div class="card-face card-back">
      <div class="card-face__content">{back}</div>
      <div class="card-face__footer">
        <button class="card-face__tts" aria-label="Text to speech">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/>
            <path d="M15.54 8.46a5 5 0 0 1 0 7.07"/>
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
  .card-container:active { cursor: grabbing; }
  .card-inner {
    position: relative;
    transform-style: preserve-3d;
    transition: transform 0.45s ease, background 0.2s ease;
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
  .card-front { background: inherit; }
  .card-back { transform: rotateY(180deg); background: var(--color-surface-alt); }
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
  .card-face__tts { color: var(--color-text-secondary); }
  .card-face__level { font-size: var(--font-size-sm); color: var(--color-text-secondary); }
</style>
