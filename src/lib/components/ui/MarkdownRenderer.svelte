<script lang="ts">
	import { marked } from 'marked';
	import { pb } from '$lib/pocketbase.svelte';
	import * as katex from 'katex';

	interface Props {
		content: string;
		enableMarkdown?: boolean;
	}

	let { content, enableMarkdown }: Props = $props();

	// Load user markdown setting if not provided
	interface UserSettings {
		enableMarkdown?: boolean;
	}
	const user = $derived(pb.authStore.record as any);
	const shouldEnableMarkdown = $derived(enableMarkdown ?? (user?.settings as UserSettings)?.enableMarkdown ?? true);

	// Configure marked once
	marked.use({
		gfm: true,
		breaks: true,
		extensions: [
			{
				name: 'highlight',
				level: 'inline',
				start(src) {
					return src.indexOf('==');
				},
				tokenizer(src) {
					const rule = /^==([^=]+)==/;
					const match = rule.exec(src);
					if (match) {
						return { type: 'highlight', raw: match[0], text: match[1] };
					}
				},
				renderer(token) {
					return `<mark>${token.text}</mark>`;
				}
			},
			{
				name: 'blockMath',
				level: 'block', // This prevents it from being treated as a paragraph
				start(src) {
					return src.indexOf('$$');
				},
				tokenizer(src) {
					const match = /^\$\$([\s\S]+?)\$\$/.exec(src);
					if (match) {
						return {
							type: 'blockMath',
							raw: match[0],
							text: match[1].trim()
						};
					}
				},
				renderer(token) {
					return `<div class="math-block">${katex.renderToString(token.text, { displayMode: true, throwOnError: false })}</div>`;
				}
			},
			{
				name: 'inlineMath',
				level: 'inline',
				start(src) {
					return src.indexOf('$');
				},
				tokenizer(src) {
					// Use a more specific regex to avoid matching the start of a $$ block
					const match = /^\$((?:[^\$\n]|\\\$)+)\$/.exec(src);
					if (match) {
						return {
							type: 'inlineMath',
							raw: match[0],
							text: match[1].trim()
						};
					}
				},
				renderer(token) {
					return katex.renderToString(token.text, { displayMode: false, throwOnError: false });
				}
			}
		]
	});

	const rendered = $derived(shouldEnableMarkdown ? marked(content) : content);

	function linkHandler(node: HTMLElement, _rendered: unknown) {
		function setupLinks() {
			node.querySelectorAll('a').forEach((a) => {
				a.target = '_blank';
				a.rel = 'noopener noreferrer';
			});
		}

		setupLinks();
		return { update: setupLinks };
	}
</script>

<div class="markdown-content" use:linkHandler={rendered}>{@html rendered}</div>

<style>
	.markdown-content {
		font-size: var(--font-size-md);
		color: var(--color-text-primary);
		line-height: 1.5;
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
	}

	.markdown-content :global(p) {
		margin: 0.5em 0;
	}
	.markdown-content :global(code) {
		background: var(--color-surface-alt);
		padding: 0.2em 0.4em;
		border-radius: 4px;
		font-family: monospace;
		font-size: 0.9em;
	}
	.markdown-content :global(pre) {
		background: var(--color-surface-alt);
		padding: var(--space-sm);
		border-radius: var(--radius-sm);
		overflow-x: auto;
		text-align: left;
	}
	.markdown-content :global(pre code) {
		background: none;
		padding: 0;
	}
	.markdown-content :global(strong) {
		font-weight: 700;
	}
	.markdown-content :global(em) {
		font-style: italic;
	}
	.markdown-content :global(ul),
	.markdown-content :global(ol) {
		text-align: left;
		padding-left: var(--space-lg);
	}
	.markdown-content :global(li) {
		margin: 0.3em 0;
	}
	.markdown-content :global(blockquote) {
		border-left: 3px solid var(--color-border);
		padding-left: var(--space-sm);
		color: var(--color-text-secondary);
		font-style: italic;
	}
	.markdown-content :global(h1),
	.markdown-content :global(h2),
	.markdown-content :global(h3),
	.markdown-content :global(h4),
	.markdown-content :global(h5),
	.markdown-content :global(h6) {
		font-weight: 700;
		margin: 0.5em 0;
		text-align: center;
	}
	.markdown-content :global(a) {
		color: var(--color-primary);
		text-decoration: underline;
		pointer-events: auto;
	}
	.markdown-content :global(a:hover) {
		opacity: 0.8;
	}
	.markdown-content :global(img) {
		max-width: 100%;
		object-fit: contain;
		display: block;
		margin: var(--space-xs) auto;
		pointer-events: none;
	}
	.markdown-content :global(table) {
		border-collapse: collapse;
		width: 100%;
		margin: 10px 0;
	}
	.markdown-content :global(th),
	.markdown-content :global(td) {
		border: 1px solid var(--color-border);
		padding: 8px;
		text-align: left;
	}
	.markdown-content :global(th) {
		background-color: var(--color-surface-alt);
		font-weight: bold;
	}
	.markdown-content :global(mark) {
		background-color: #b6aa40;
		color: var(--color-text-primary);
		padding: 0.1em 0.2em;
		border-radius: 2px;
	}

	/* .markdown-content :global(.katex-mathml) {
		display: none;
	} */
	.markdown-content :global(.katex-html) {
		display: none;
	}
</style>
