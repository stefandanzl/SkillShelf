<script lang="ts">
  interface Props { value: number; } // 0-100
  let { value }: Props = $props();
</script>

<div class="progress-bar">
  <div class="progress-bar__fill" style="width: {value}%"></div>
</div>

<style>
  .progress-bar {
    height: 4px;
    background: var(--color-surface-alt);
    width: 100%;
  }
  .progress-bar__fill {
    height: 100%;
    background: var(--color-primary);
    transition: width var(--transition-base);
    border-radius: 0 2px 2px 0;
  }
</style>
