<script lang="ts">
  import { goto } from '$app/navigation';
  import { onMount } from 'svelte';

  let { children, data } = $props();

  onMount(() => {
    if (!data.user) goto('/sign/in');
  });
</script>

{#if data.user}
  {@render children()}
{/if}
