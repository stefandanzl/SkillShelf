<script lang="ts">
  interface Props {
    checked: boolean;
    onchange?: (v: boolean) => void;
  }
  let { checked, onchange }: Props = $props();
</script>

<button
  class="toggle"
  class:toggle--on={checked}
  role="switch"
  aria-checked={checked}
  onclick={() => onchange?.(!checked)}
>
  <span class="toggle__thumb"></span>
</button>

<style>
  .toggle {
    width: 51px;
    height: 31px;
    border-radius: var(--radius-pill);
    background: var(--color-surface-alt);
    position: relative;
    transition: background var(--transition-fast);
    flex-shrink: 0;
  }
  .toggle--on { background: var(--color-primary); }
  .toggle__thumb {
    position: absolute;
    top: 3px;
    left: 3px;
    width: 25px;
    height: 25px;
    border-radius: 50%;
    background: white;
    transition: transform var(--transition-fast);
    box-shadow: 0 2px 4px rgba(0,0,0,0.3);
  }
  .toggle--on .toggle__thumb { transform: translateX(20px); }
</style>
