<script lang="ts">
	import { page } from '$app/state';

	console.log(JSON.stringify(page, null, 2));
</script>

<h1>{page.status}</h1>
<p>{page.error?.message}</p>

<style>
	p {
		margin-inline: auto;
		text-align: center;
	}
</style>
