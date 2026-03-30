<script lang="ts">
  interface Props {
    name?: string;
    src?: string;
    size?: number;
    color?: string;
  }
  let { name = '', src, size = 40, color = 'var(--color-primary)' }: Props = $props();

  const initials = $derived(
    name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) || '?'
  );
</script>

<div
  class="avatar"
  style="width:{size}px;height:{size}px;background:{src ? 'transparent' : color};font-size:{Math.floor(size * 0.4)}px"
>
  {#if src}
    <img {src} alt={name} />
  {:else}
    {initials}
  {/if}
</div>

<style>
  .avatar {
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    font-weight: 700;
    color: white;
    flex-shrink: 0;
    overflow: hidden;
  }
  .avatar img { width: 100%; height: 100%; object-fit: cover; }
</style>
