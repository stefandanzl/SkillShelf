<script lang="ts">
  import type { Snippet } from 'svelte';
  interface Props { children: Snippet; }
  let { children }: Props = $props();
</script>

<div class="settings-group">
  {@render children()}
</div>

<style>
  .settings-group {
    display: flex;
    flex-direction: column;
    gap: 2px;
    border-radius: var(--radius-md);
    overflow: hidden;
  }
  .settings-group > :global(*) {
    border-radius: 0 !important;
  }
  .settings-group > :global(*:first-child) {
    border-radius: var(--radius-md) var(--radius-md) 0 0 !important;
  }
  .settings-group > :global(*:last-child) {
    border-radius: 0 0 var(--radius-md) var(--radius-md) !important;
  }
  .settings-group > :global(*:only-child) {
    border-radius: var(--radius-md) !important;
  }
</style>
