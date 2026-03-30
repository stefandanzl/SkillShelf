<script lang="ts">
  interface Props {
    value: number; // 0-100
    size?: number;
    color?: string;
    trackColor?: string;
  }
  let { value, size = 40, color = 'var(--color-danger)', trackColor = 'var(--color-surface-alt)' }: Props = $props();

  const radius = $derived((size - 6) / 2);
  const circumference = $derived(2 * Math.PI * radius);
  const offset = $derived(circumference - (value / 100) * circumference);
</script>

<svg width={size} height={size} viewBox="0 0 {size} {size}" class="circular-progress">
  <circle
    cx={size/2} cy={size/2} r={radius}
    fill="none" stroke={trackColor} stroke-width="3"
  />
  <circle
    cx={size/2} cy={size/2} r={radius}
    fill="none" stroke={color} stroke-width="3"
    stroke-dasharray={circumference}
    stroke-dashoffset={offset}
    stroke-linecap="round"
    transform="rotate(-90 {size/2} {size/2})"
    style="transition: stroke-dashoffset var(--transition-base)"
  />
  <text
    x={size/2} y={size/2}
    text-anchor="middle" dominant-baseline="central"
    font-size="9" fill="var(--color-text-secondary)" font-family="inherit"
  >{Math.round(value)}%</text>
</svg>

<style>
  .circular-progress { display: block; flex-shrink: 0; }
</style>
