<script lang="ts">
  import { enhance } from "$app/forms";
  import { page } from "$app/state";

  interface Data {
    error?: string;
  }

  let { data, form }: { data: Data; form: Data } = $props();

  let username = $state("");
  let password = $state("");
  let message = $derived(form?.error || page.url.searchParams.get("message"));
  let disabled = $derived(!username || !password);
</script>

<form method="POST" use:enhance>
  <h3>Sign in to your account</h3>

  <fieldset>
    <label for="username">Email </label>
    <input autocomplete="email" bind:value={username} id="username" name="username" type="email" required />

    <label for="password">Password</label>
    <input autocomplete="on" bind:value={password} id="password" name="password" type="password" required />

    <button {disabled} type="submit">Sign in</button>

    <p>Not a member? <a href="/sign/up">Sign up for an account</a>.</p>
  </fieldset>
</form>

{#if message}
  <div class="error">
    {message}
  </div>
{/if}

<style>
  form {
    display: flex;
    flex-direction: column;
    gap: var(--space-md);
    min-height: 100vh;
    justify-content: center;
    padding: var(--space-md);
  }

  h3 {
    text-align: center;
    margin: 0;
  }

  fieldset {
    display: flex;
    flex-direction: column;
    gap: var(--space-sm);
    border: none;
    padding: 0;
  }

  input {
    background-color: var(--color-surface);
    border: 1px solid var(--color-border);
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-sm);
    width: 100%;
  }

  input:focus {
    border-color: var(--color-border-active);
  }

  button {
    background-color: var(--color-primary);
    color: white;
    border: none;
    padding: var(--space-sm) var(--space-md);
    border-radius: var(--radius-sm);
    width: 100%;
    cursor: pointer;
    font-weight: 600;
    margin-top: var(--space-md);
  }

  button:hover:not(:disabled) {
    opacity: 0.9;
  }

  button:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .error {
    color: var(--color-danger);
    margin-top: var(--space-md);
  }
</style>
