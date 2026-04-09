<script lang="ts">
	import { t } from '$lib/i18n';
	import { page } from '$app/state';
	import { goto, invalidateAll } from '$app/navigation';
	import TopBar from '$lib/components/ui/TopBar.svelte';
	import PillButton from '$lib/components/ui/PillButton.svelte';
	import { pb } from '$lib/pocketbase.svelte';
	import { createCard, getCards, findOrCreateImage, buildImageMap } from '$lib/api';

	const boxId = $derived(page.params.id);

	// ── File state ──────────────────────────────────────────────────────────────
	let fileContent = $state('');
	let fileName = $state('');
	let isDragOver = $state(false);
	let fileError = $state('');

	// ── Text input state ────────────────────────────────────────────────────────
	let textInput = $state('');
	let pasting = $state(false);

	// ── Parse options ───────────────────────────────────────────────────────────
	type Delimiter = 'auto' | 'semicolon' | 'comma' | 'tab';
	let delimiterChoice = $state<Delimiter>('auto');
	let firstRowIsHeader = $state(false);

	// ── Help section ────────────────────────────────────────────────────────────
	let helpOpen = $state(false);

	// ── Anki rows (set when .apkg is loaded, bypasses CSV parsing) ─────────────
	let ankiRows = $state<Array<{ front: string; back: string; frontImage?: File; backImage?: File }> | null>(null);
	let ankiImages = $state<Map<string, Uint8Array> | null>(null); // filename -> image data
	let swapAnkiFields = $state(false);

	// ── Import state ────────────────────────────────────────────────────────────
	let importing = $state(false);
	let importProgress = $state(0);
	let importError = $state('');
	let importComplete = $state(false);
	let createdCount = $state(0);
	let skippedCount = $state(0);

	// ── File input ref ──────────────────────────────────────────────────────────
	let fileInput: HTMLInputElement | undefined = $state();

	// ── Delimiter detection ─────────────────────────────────────────────────────
	const HEADER_KEYWORDS = ['front', 'back', 'question', 'answer', 'frage', 'antwort', 'vorderseite', 'rückseite'];

	// Proper CSV parser that handles quoted fields and escaped quotes
	function parseCSVLine(line: string, delimiter: string): string[] {
		const result: string[] = [];
		let current = '';
		let inQuotes = false;
		let i = 0;

		while (i < line.length) {
			const char = line[i];
			const nextChar = line[i + 1];

			if (inQuotes) {
				if (char === '"' && nextChar === '"') {
					// Escaped quote ("")
					current += '"';
					i += 2;
				} else if (char === '"') {
					// End of quoted field
					inQuotes = false;
					i++;
				} else {
					current += char;
					i++;
				}
			} else {
				if (char === '"') {
					// Start of quoted field
					inQuotes = true;
					i++;
				} else if (char === delimiter) {
					// Delimiter - end of current field
					result.push(current);
					current = '';
					i++;
				} else {
					current += char;
					i++;
				}
			}
		}

		result.push(current);
		return result;
	}

	function detectDelimiter(text: string): string {
		const firstLines = text
			.split('\n')
			.slice(0, 5)
			.filter((l) => l.trim());
		if (firstLines.length === 0) return ';';

		const delimiters = [
			{ char: '\t', name: 'tab' },
			{ char: ';', name: 'semicolon' },
			{ char: ',', name: 'comma' }
		];

		// Score each delimiter by consistency of column count across lines
		let bestDelimiter = ';';
		let bestScore = -1;

		for (const d of delimiters) {
			const counts = firstLines.map((l) => parseCSVLine(l, d.char).length);
			const allTwo = counts.every((c) => c >= 2);
			if (!allTwo) continue;

			// Prefer delimiter that gives consistent column count
			const consistency = counts.every((c) => c === counts[0]) ? 2 : 1;
			const score = consistency * 10 + counts[0];
			if (score > bestScore) {
				bestScore = score;
				bestDelimiter = d.char;
			}
		}
		return bestDelimiter;
	}

	function detectHeader(firstRow: string[]): boolean {
		const lower = firstRow.map((c) => c.trim().toLowerCase());
		return lower.some((c) => HEADER_KEYWORDS.includes(c));
	}

	function autoDetectHeader(text: string) {
		const delimiter = detectDelimiter(text);
		const firstLine = text.split('\n').find((l) => l.trim());
		if (!firstLine) return;
		const parts = parseCSVLine(firstLine, delimiter);
		firstRowIsHeader = detectHeader(parts);
	}

	function getDelimiterChar(choice: Delimiter, text: string): string {
		if (choice === 'auto') return detectDelimiter(text);
		if (choice === 'semicolon') return ';';
		if (choice === 'comma') return ',';
		return '\t';
	}

	// ── Anki parsing ────────────────────────────────────────────────────────────
	// MD5 hash function for image deduplication
	async function calculateMD5(file: File | Uint8Array): Promise<string> {
		await loadScript('https://cdnjs.cloudflare.com/ajax/libs/spark-md5/3.0.2/spark-md5.min.js');
		const data = file instanceof File ? await file.arrayBuffer() : file.buffer;
		return (window as any).SparkMD5.ArrayBuffer.hash(data);
	}

	function loadScript(src: string): Promise<void> {
		if (document.querySelector(`script[src="${src}"]`)) return Promise.resolve();
		return new Promise((resolve, reject) => {
			const s = document.createElement('script');
			s.src = src;
			s.onload = () => resolve();
			s.onerror = reject;
			document.head.appendChild(s);
		});
	}

	// Extract ALL image filenames from <img> tags
	function extractAllImageSrcs(html: string): string[] {
		const imgRegex = /<img\s+[^>]*src=["']([^"']+)["']/gi;
		const sources: string[] = [];
		let match;
		while ((match = imgRegex.exec(html)) !== null) {
			sources.push(match[1]);
		}
		return sources;
	}

	async function parseApkg(file: File): Promise<{
		cards: Array<{ front: string; back: string }>;
		images: Map<string, Uint8Array>;
	}> {
		const [fflate] = await Promise.all([
			import('https://cdn.jsdelivr.net/npm/fflate@0.8.2/+esm' as any),
			loadScript('https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.js')
		]);
		const buf = await file.arrayBuffer();
		const unzipped = fflate.unzipSync(new Uint8Array(buf));

		const SQL = await (window as any).initSqlJs({
			locateFile: (f: string) => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${f}`
		});

		// Try different collection file formats in order - try OLDER formats first for compatibility
		const collectionFiles = ['collection.anki21', 'collection.anki20', 'collection.anki2'];
		let db: typeof SQL.Database | null = null;
		let lastError: Error | null = null;

		for (const filename of collectionFiles) {
			const dbFile = unzipped[filename];
			if (!dbFile) continue;

			try {
				const testDb = new SQL.Database(dbFile);
				testDb.exec('SELECT COUNT(*) FROM notes');
				db = testDb;
				console.log(`Successfully opened ${filename}`);
				break;
			} catch (e: any) {
				console.log(`Failed to open ${filename}:`, e?.message ?? e);
				lastError = e;
				continue;
			}
		}

		if (!db) {
			throw new Error(
				`No readable collection file found in .apkg (tried anki21, anki20, anki2). Last error: ${lastError?.message ?? 'Unknown error'}`
			);
		}

		// Get notes with field data
		const notesResult = db.exec(`
      SELECT flds
      FROM notes
      LIMIT 10000
    `);
		db.close();
		if (!notesResult[0]) return [];

		// Parse media mapping if present
		let mediaMap: Record<string, number> = {};
		try {
			const mediaJson = unzipped['media'];
			if (mediaJson) {
				const decoder = new TextDecoder('utf-8');
				const mediaStr = decoder.decode(mediaJson);
				const mediaData = JSON.parse(mediaStr);
				mediaMap = Object.fromEntries(Object.entries(mediaData).map(([k, v]) => [v as string, parseInt(k)]));
			}
		} catch (e) {
			// Media metadata parse failed, continue without media
		}

		// Collect unique images that need to be uploaded
		const imagesToUpload = new Map<string, Uint8Array>(); // filename -> data

		// First pass: collect all unique images
		for (const row of notesResult[0].values) {
			const fields = (row[0] as string).split('\x1f');
			const frontRaw = (fields[0] ?? '').trim();
			const backRaw = (fields[1] ?? '').trim();

			for (const html of [frontRaw, backRaw]) {
				const imgSrcs = extractAllImageSrcs(html);
				for (const imgSrc of imgSrcs) {
					if (mediaMap[imgSrc] !== undefined && !imagesToUpload.has(imgSrc)) {
						const mediaIndex = mediaMap[imgSrc];
						const mediaKey = Object.keys(unzipped).find(
							(k) =>
								k !== 'collection.anki2' &&
								k !== 'collection.anki21' &&
								k !== 'collection.anki20' &&
								k !== 'media' &&
								parseInt(k) === mediaIndex
						);
						if (mediaKey) {
							imagesToUpload.set(imgSrc, unzipped[mediaKey]);
						}
					}
				}
			}
		}

		const cards = notesResult[0].values
			.map((row: any[]) => {
				const fields = (row[0] as string).split('\x1f');
				const frontRaw = (fields[0] ?? '').trim();
				const backRaw = (fields[1] ?? '').trim();

				// Store raw HTML as-is
				return { front: frontRaw, back: backRaw };
			})
			.filter((c: any) => c.front || c.back);

		// Return both cards and images (images will be uploaded during import)
		return { cards, images: imagesToUpload };
	}

	// ── Parsed data ─────────────────────────────────────────────────────────────
	const activeDelimiter = $derived(getDelimiterChar(delimiterChoice, fileContent));

	type RowData = { front: string; back: string };

	const allRows = $derived.by(() => {
		if (ankiRows !== null) return swapAnkiFields ? ankiRows.map((r) => ({ front: r.back, back: r.front })) : ankiRows;
		if (!fileContent) return [];

		const lines = fileContent.split('\n').map((line) => line.replace(/\r$/, ''));
		const rows: RowData[] = [];
		let accumulated = '';
		let insideQuote = false;

		for (const line of lines) {
			let charIndex = 0;
			while (charIndex < line.length) {
				const char = line[charIndex];
				if (char === '"') {
					insideQuote = !insideQuote;
				}
				charIndex++;
			}

			accumulated += (accumulated ? '\n' : '') + line;

			// If we're outside quotes at the end of line, we have a complete row
			if (!insideQuote) {
				const trimmed = accumulated.trim();
				if (trimmed) {
					const parts = parseCSVLine(trimmed, activeDelimiter);
					if (parts.length >= 2) {
						rows.push({
							front: (parts[0] ?? '').trim(),
							back: (parts.slice(1).join(activeDelimiter) ?? '').trim()
						});
					}
				}
				accumulated = '';
			}
		}

		return rows;
	});

	// Auto-detect header is done inside processFile after content is loaded

	const cards = $derived(firstRowIsHeader ? allRows.slice(1) : allRows);

	const validCards = $derived(cards.filter((c) => c.front.length > 0 && c.back.length > 0));

	const cardCount = $derived(validCards.length);

	// ── File handling ───────────────────────────────────────────────────────────
	async function processFile(file: File) {
		fileError = '';
		const ext = file.name.split('.').pop()?.toLowerCase();

		if (ext === 'apkg') {
			if (file.size > 50 * 1024 * 1024) {
				fileError = 'File is too large (max 50 MB).';
				return;
			}
			fileName = file.name;
			fileContent = 'anki'; // non-empty to trigger the file-loaded UI
			try {
				const result = await parseApkg(file);
				ankiRows = result.cards;
				ankiImages = result.images;
			} catch (e: any) {
				fileError = `Failed to parse .apkg: ${e?.message ?? 'Unknown error'}`;
				fileContent = '';
				ankiRows = null;
				ankiImages = null;
			}
			return;
		}

		if (ext !== 'csv' && ext !== 'txt') {
			fileError = 'Only .csv, .txt, and .apkg files are supported.';
			return;
		}
		if (file.size > 5 * 1024 * 1024) {
			fileError = 'File is too large (max 5 MB).';
			return;
		}

		fileName = file.name;
		const reader = new FileReader();
		reader.onload = (e) => {
			const text = (e.target?.result as string) ?? '';
			fileContent = text;
			delimiterChoice = 'auto';
			autoDetectHeader(text);
		};
		reader.onerror = () => {
			fileError = 'Failed to read file.';
		};
		reader.readAsText(file);
	}

	function handleDrop(e: DragEvent) {
		e.preventDefault();
		isDragOver = false;
		const file = e.dataTransfer?.files?.[0];
		if (file) processFile(file);
	}

	function handleDragOver(e: DragEvent) {
		e.preventDefault();
		isDragOver = true;
	}

	function handleDragLeave() {
		isDragOver = false;
	}

	function handleFileInput(e: Event) {
		const input = e.target as HTMLInputElement;
		const file = input.files?.[0];
		if (file) processFile(file);
	}

	function clearFile() {
		fileContent = '';
		fileName = '';
		fileError = '';
		ankiRows = null;
		ankiImages = null;
		swapAnkiFields = false;
		textInput = '';
		importing = false;
		importProgress = 0;
		importError = '';
		importComplete = false;
		createdCount = 0;
		skippedCount = 0;
		if (fileInput) fileInput.value = '';
	}

	// ── Text input handling ───────────────────────────────────────────────────────
	async function handlePaste() {
		pasting = true;
		try {
			const text = await navigator.clipboard.readText();
			textInput = text;
		} catch (e) {
			fileError = 'Failed to read from clipboard. Please paste manually.';
		} finally {
			pasting = false;
		}
	}

	function handleParseText() {
		if (!textInput.trim()) return;
		fileError = '';
		fileName = 'pasted-text.txt';
		fileContent = textInput;
		// Reset options for fresh auto-detection
		delimiterChoice = 'auto';
		// Auto-detect header from first row
		autoDetectHeader(textInput);
	}

	// ── Import ──────────────────────────────────────────────────────────────────
	async function handleImport() {
		if (importing || validCards.length === 0) return;
		importing = true;
		importProgress = 0;
		importError = '';
		importComplete = false;
		createdCount = 0;
		skippedCount = 0;

		try {
			// Upload images first (for Anki imports)
			if (ankiImages && ankiImages.size > 0) {
				for (const [filename, data] of ankiImages) {
					const ext = filename.split('.').pop()?.toLowerCase() || 'png';
					const file = new File([data], filename, { type: `image/${ext === 'jpg' ? 'jpeg' : ext}` });
					const hash = await calculateMD5(file);
					await findOrCreateImage(pb as any, boxId, filename, hash, file);
				}
			}

			// Build image map for replacing image URLs
			const imageMap = await buildImageMap(pb as any, boxId);

			// Function to replace image URLs in card content
			function replaceImageUrls(content: string): string {
				return content.replace(/<img\s+src=["']([^"']+)["'][^>]*>/gi, (match, filename) => {
					const url = imageMap[filename];
					if (url) {
						// Replace the filename with the actual URL, keep other attributes
						return match.replace(`src="${filename}"`, `src="${url}"`).replace(`src='${filename}'`, `src='${url}'`);
					}
					return match; // Keep original if URL not found
				});
			}

			// Fetch existing cards for deduplication
			const existingCards = await getCards(pb as any, boxId);
			const existingSignatures = new Set(existingCards.map((c) => `${c.front ?? ''}|||${c.back ?? ''}`));

			for (let i = 0; i < validCards.length; i++) {
				const card = validCards[i];

				// Replace image URLs before creating card
				const front = replaceImageUrls(card.front);
				const back = replaceImageUrls(card.back);
				const signature = `${front}|||${back}`;

				if (existingSignatures.has(signature)) {
					skippedCount++;
				} else {
					await createCard(pb as any, boxId, { front, back });
					createdCount++;
					existingSignatures.add(signature);
				}
				importProgress = i + 1;
			}
			importComplete = true;
			importing = false;
			await invalidateAll();
		} catch (e: any) {
			importError = `Import failed at card ${importProgress + 1}: ${e?.message ?? 'Unknown error'}`;
			importing = false;
		}
	}

	function delimiterLabel(d: Delimiter): string {
		if (d === 'auto') return 'Auto';
		if (d === 'semicolon') return 'Semicolon (;)';
		if (d === 'comma') return 'Comma (,)';
		return 'Tab';
	}
</script>

<div class="import-page">
	<TopBar showBack title={$t('box.import')} onback={() => goto(`/boxes/${boxId}/settings`)} />

	<div class="import-page__content">
		<!-- Help section -->
		<button class="help-toggle" onclick={() => (helpOpen = !helpOpen)}>
			<svg
				width="18"
				height="18"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<circle cx="12" cy="12" r="10"></circle>
				<path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"></path>
				<line x1="12" y1="17" x2="12.01" y2="17"></line>
			</svg>
			<span>CSV Format Help</span>
			<svg
				class="help-toggle__chevron"
				class:help-toggle__chevron--open={helpOpen}
				width="16"
				height="16"
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				stroke-width="2"
				stroke-linecap="round"
				stroke-linejoin="round"
			>
				<polyline points="6 9 12 15 18 9"></polyline>
			</svg>
		</button>

		{#if helpOpen}
			<div class="help-box">
				<p>Each row is one card. Front and back separated by a delimiter.</p>
				<div class="help-box__examples">
					<code>front;back</code>
					<code>front,back</code>
					<code>front&#9;back</code>
				</div>
				<p>First row can be a header (auto-detected if it contains "front", "back", "question", or "answer").</p>
			</div>
		{/if}

		<!-- Drop zone (only when no file loaded) -->
		{#if !fileContent}
			<div
				class="drop-zone"
				class:drop-zone--active={isDragOver}
				ondrop={handleDrop}
				ondragover={handleDragOver}
				ondragleave={handleDragLeave}
				role="button"
				tabindex="0"
				onkeydown={(e) => {
					if (e.key === 'Enter' || e.key === ' ') fileInput?.click();
				}}
				onclick={() => fileInput?.click()}
			>
				<svg
					width="40"
					height="40"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.5"
					stroke-linecap="round"
					stroke-linejoin="round"
					class="drop-zone__icon"
				>
					<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
					<polyline points="7 10 12 15 17 10"></polyline>
					<line x1="12" y1="15" x2="12" y2="3"></line>
				</svg>
				<p class="drop-zone__text">Drag & drop a CSV, TXT, or APKG file here</p>
				<p class="drop-zone__subtext">or tap to browse</p>
			</div>

			<input bind:this={fileInput} type="file" accept=".csv,.txt,.apkg" onchange={handleFileInput} class="sr-only" />

			<!-- Text input area -->
			<div class="text-input-area">
				<div class="text-input-header">
					<span class="text-input-label">Or paste your text directly:</span>
					<button class="paste-button" onclick={handlePaste} disabled={pasting}>
						<svg
							width="14"
							height="14"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
						>
							<path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"></path>
							<rect x="8" y="2" width="8" height="4" rx="1" ry="1"></rect>
						</svg>
						{pasting ? 'Pasting...' : 'Paste Text'}
					</button>
				</div>
				<textarea
					bind:value={textInput}
					class="text-textarea"
					placeholder="Paste your CSV/text content here...
Example:
front;back
Question 1;Answer 1
Question 2;Answer 2"
					rows="6"
				></textarea>
				<button class="parse-button" onclick={handleParseText} disabled={!textInput.trim()}> Parse Now </button>
			</div>

			{#if fileError}
				<p class="error-text">{fileError}</p>
			{/if}
		{:else}
			<!-- File loaded: show options & preview -->
			<div class="file-header">
				<div class="file-header__info">
					<svg
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"></path>
						<polyline points="14 2 14 8 20 8"></polyline>
					</svg>
					<span class="file-header__name">{fileName}</span>
				</div>
				<button class="file-header__clear" onclick={clearFile} title="Remove file">
					<svg
						width="18"
						height="18"
						viewBox="0 0 24 24"
						fill="none"
						stroke="currentColor"
						stroke-width="2"
						stroke-linecap="round"
						stroke-linejoin="round"
					>
						<line x1="18" y1="6" x2="6" y2="18"></line>
						<line x1="6" y1="6" x2="18" y2="18"></line>
					</svg>
				</button>
			</div>

			<!-- Swap toggle (Anki only) -->
			{#if ankiRows !== null}
				<label class="option-label">
					<input type="checkbox" bind:checked={swapAnkiFields} class="option-checkbox" />
					Swap front / back
				</label>
			{/if}

			<!-- Options row (CSV only) -->
			{#if ankiRows === null}
				<div class="options">
					<div class="option-group">
						<label class="option-label" for="delimiter-select">Delimiter</label>
						<select id="delimiter-select" class="option-select" bind:value={delimiterChoice}>
							{#each ['auto', 'semicolon', 'comma', 'tab'] as const as d (d)}
								<option value={d}>{delimiterLabel(d)}</option>
							{/each}
						</select>
					</div>

					<div class="option-group">
						<label class="option-label">
							<input type="checkbox" bind:checked={firstRowIsHeader} class="option-checkbox" />
							First row is header
						</label>
					</div>
				</div>
			{/if}

			<!-- Card count -->
			<div class="card-count">
				<span class="card-count__number">{cardCount}</span>
				<span class="card-count__label">cards will be imported</span>
				{#if cards.length !== validCards.length}
					<span class="card-count__warning">
						({cards.length - validCards.length} rows skipped - missing front or back)
					</span>
				{/if}
			</div>

			<!-- Preview table -->
			{#if allRows.length > 0}
				<div class="preview-wrapper">
					<table class="preview-table">
						<thead>
							<tr>
								<th class="preview-table__th preview-table__th--num">#</th>
								<th class="preview-table__th preview-table__th--front">Front</th>
								<th class="preview-table__th preview-table__th--back">Back</th>
							</tr>
						</thead>
						<tbody>
							{#each allRows as row, i (i)}
								<tr
									class="preview-table__row"
									class:preview-table__row--header={i === 0 && firstRowIsHeader}
									class:preview-table__row--invalid={(!row.front && !row.frontImage) || (!row.back && !row.backImage)}
								>
									<td class="preview-table__cell preview-table__cell--num">
										{#if i === 0 && firstRowIsHeader}
											<span class="header-badge">H</span>
										{:else}
											{firstRowIsHeader ? i : i + 1}
										{/if}
									</td>
									<td class="preview-table__cell preview-table__cell--front">
										{row.front}
									</td>
									<td class="preview-table__cell preview-table__cell--back">
										{row.back}
									</td>
								</tr>
							{/each}
						</tbody>
					</table>
				</div>
			{/if}

			<!-- Import error -->
			{#if importError}
				<p class="error-text">{importError}</p>
			{/if}

			<!-- Import progress -->
			{#if importing}
				<div class="progress-bar">
					<div
						class="progress-bar__fill"
						style="width: {cardCount > 0 ? (importProgress / cardCount) * 100 : 0}%"
					></div>
				</div>
				<p class="progress-text">Importing {importProgress} / {cardCount}...</p>
			{/if}

			<!-- Import complete results -->
			{#if importComplete}
				<div class="import-results">
					<div class="import-results__row">
						<svg
							width="20"
							height="20"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="2"
							stroke-linecap="round"
							stroke-linejoin="round"
							class="import-results__icon import-results__icon--success"
						>
							<polyline points="20 6 9 17 4 12"></polyline>
						</svg>
						<span class="import-results__text">
							<strong>{createdCount}</strong> cards created
						</span>
					</div>
					{#if skippedCount > 0}
						<div class="import-results__row">
							<svg
								width="20"
								height="20"
								viewBox="0 0 24 24"
								fill="none"
								stroke="currentColor"
								stroke-width="2"
								stroke-linecap="round"
								stroke-linejoin="round"
								class="import-results__icon import-results__icon--skipped"
							>
								<circle cx="12" cy="12" r="10"></circle>
								<line x1="12" y1="8" x2="12" y2="12"></line>
								<line x1="12" y1="16" x2="12.01" y2="16"></line>
							</svg>
							<span class="import-results__text">
								<strong>{skippedCount}</strong> skipped (duplicates)
							</span>
						</div>
					{/if}
				</div>
			{/if}

			<!-- Import button -->
			{#if !importComplete}
				<PillButton onclick={handleImport} disabled={importing || validCards.length === 0}>
					{#if importing}
						Importing {importProgress} / {cardCount}...
					{:else}
						Import {cardCount} Cards
					{/if}
				</PillButton>
			{:else}
				<div class="action-buttons">
					<PillButton onclick={() => goto(`/boxes/${boxId}`)}>Done</PillButton>
					<PillButton onclick={clearFile} variant="secondary">Import More</PillButton>
				</div>
			{/if}
		{/if}
	</div>
</div>

<style>
	.import-page {
		display: flex;
		flex-direction: column;
		min-height: 100%;
	}

	.import-page__content {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
		padding: 0 var(--space-md) var(--space-xl);
	}

	/* ── Help toggle ─────────────────────────────────────────────────────────── */
	.help-toggle {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		background: none;
		border: none;
		color: var(--color-text-secondary);
		font-size: var(--font-size-sm);
		cursor: pointer;
		padding: var(--space-xs) 0;
		transition: color var(--transition-fast);
	}
	.help-toggle:hover {
		color: var(--color-text-primary);
	}
	.help-toggle__chevron {
		transition: transform var(--transition-fast);
		margin-left: auto;
	}
	.help-toggle__chevron--open {
		transform: rotate(180deg);
	}

	.help-box {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-md);
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		line-height: 1.6;
	}
	.help-box p {
		margin: 0 0 var(--space-sm);
	}
	.help-box p:last-child {
		margin-bottom: 0;
	}
	.help-box__examples {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
		margin-bottom: var(--space-sm);
	}
	.help-box__examples code {
		background: var(--color-bg);
		padding: var(--space-xs) var(--space-sm);
		border-radius: var(--radius-sm);
		font-size: var(--font-size-xs);
		color: var(--color-text-primary);
		font-family: monospace;
	}

	/* ── Drop zone ───────────────────────────────────────────────────────────── */
	.drop-zone {
		display: flex;
		flex-direction: column;
		align-items: center;
		justify-content: center;
		gap: var(--space-sm);
		border: 2px dashed var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-xl) var(--space-md);
		cursor: pointer;
		transition:
			border-color var(--transition-fast),
			background var(--transition-fast);
		min-height: 180px;
	}
	.drop-zone:hover,
	.drop-zone:focus-visible {
		border-color: var(--color-primary-dim);
	}
	.drop-zone--active {
		border-color: var(--color-primary);
		background: color-mix(in srgb, var(--color-primary) 8%, transparent);
	}
	.drop-zone__icon {
		color: var(--color-text-secondary);
	}
	.drop-zone--active .drop-zone__icon {
		color: var(--color-primary);
	}
	.drop-zone__text {
		margin: 0;
		font-size: var(--font-size-base);
		color: var(--color-text-primary);
		font-weight: 500;
	}
	.drop-zone__subtext {
		margin: 0;
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
	}

	/* ── Text input area ───────────────────────────────────────────────────────── */
	.text-input-area {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}
	.text-input-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.text-input-label {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
	}
	.paste-button {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		padding: var(--space-xs) var(--space-sm);
		color: var(--color-text-primary);
		font-size: var(--font-size-sm);
		cursor: pointer;
		transition: all var(--transition-fast);
	}
	.paste-button:hover:not(:disabled) {
		border-color: var(--color-primary);
		color: var(--color-primary);
	}
	.paste-button:disabled {
		opacity: 0.6;
		cursor: not-allowed;
	}
	.text-textarea {
		width: 100%;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-md);
		color: var(--color-text-primary);
		font-size: var(--font-size-sm);
		font-family: monospace;
		resize: vertical;
		min-height: 150px;
		transition: border-color var(--transition-fast);
	}
	.text-textarea:focus {
		outline: none;
		border-color: var(--color-primary);
	}
	.text-textarea::placeholder {
		color: var(--color-text-secondary);
		opacity: 0.7;
	}
	.parse-button {
		background: var(--color-primary);
		color: var(--color-primary-text);
		border: none;
		border-radius: var(--radius-md);
		padding: var(--space-sm) var(--space-md);
		font-size: var(--font-size-sm);
		font-weight: 500;
		cursor: pointer;
		transition: opacity var(--transition-fast);
		align-self: flex-start;
	}
	.parse-button:hover:not(:disabled) {
		opacity: 0.9;
	}
	.parse-button:disabled {
		opacity: 0.4;
		cursor: not-allowed;
	}

	.sr-only {
		position: absolute;
		width: 1px;
		height: 1px;
		padding: 0;
		margin: -1px;
		overflow: hidden;
		clip: rect(0, 0, 0, 0);
		white-space: nowrap;
		border: 0;
	}

	/* ── File header ─────────────────────────────────────────────────────────── */
	.file-header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-sm) var(--space-md);
	}
	.file-header__info {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
		color: var(--color-text-primary);
		min-width: 0;
	}
	.file-header__name {
		font-size: var(--font-size-sm);
		font-weight: 500;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.file-header__clear {
		background: none;
		border: none;
		color: var(--color-text-secondary);
		cursor: pointer;
		padding: var(--space-xs);
		border-radius: var(--radius-sm);
		display: flex;
		align-items: center;
		justify-content: center;
		flex-shrink: 0;
		transition: color var(--transition-fast);
	}
	.file-header__clear:hover {
		color: var(--color-danger);
	}

	/* ── Options ─────────────────────────────────────────────────────────────── */
	.options {
		display: flex;
		flex-wrap: wrap;
		gap: var(--space-md);
		align-items: flex-end;
	}
	.option-group {
		display: flex;
		flex-direction: column;
		gap: var(--space-xs);
	}
	.option-label {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		font-weight: 500;
		display: flex;
		align-items: center;
		gap: var(--space-xs);
	}
	.option-select {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-sm);
		padding: var(--space-xs) var(--space-sm);
		color: var(--color-text-primary);
		font-size: var(--font-size-sm);
	}
	.option-select:focus {
		border-color: var(--color-primary);
		outline: none;
	}
	.option-checkbox {
		accent-color: var(--color-primary);
	}

	/* ── Card count ──────────────────────────────────────────────────────────── */
	.card-count {
		display: flex;
		align-items: baseline;
		gap: var(--space-xs);
		flex-wrap: wrap;
	}
	.card-count__number {
		font-size: var(--font-size-lg);
		font-weight: 700;
		color: var(--color-primary);
	}
	.card-count__label {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
	}
	.card-count__warning {
		font-size: var(--font-size-xs);
		color: var(--color-danger);
	}

	/* ── Preview table ───────────────────────────────────────────────────────── */
	.preview-wrapper {
		overflow-x: auto;
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		-webkit-overflow-scrolling: touch;
	}
	.preview-table {
		width: 100%;
		border-collapse: collapse;
		font-size: var(--font-size-sm);
		min-width: 400px;
	}
	.preview-table__th {
		text-align: left;
		padding: var(--space-sm) var(--space-sm);
		font-size: var(--font-size-xs);
		font-weight: 600;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
		background: var(--color-surface);
		border-bottom: 1px solid var(--color-border);
		position: sticky;
		top: 0;
	}
	.preview-table__th--num {
		width: 40px;
		text-align: center;
	}
	.preview-table__row {
		transition: background var(--transition-fast);
	}
	.preview-table__row:not(:last-child) .preview-table__cell {
		border-bottom: 1px solid var(--color-border);
	}
	.preview-table__row--header {
		opacity: 0.5;
	}
	.preview-table__row--invalid {
		opacity: 0.4;
	}
	.preview-table__cell {
		padding: var(--space-sm);
		color: var(--color-text-primary);
		word-break: break-word;
		max-width: 300px;
	}
	.preview-table__cell--num {
		text-align: center;
		color: var(--color-text-secondary);
		font-size: var(--font-size-xs);
	}
	.preview-table__cell--front {
		background: color-mix(in srgb, #5b9bd5 10%, transparent);
	}
	.preview-table__cell--back {
		background: color-mix(in srgb, #6bc77a 10%, transparent);
	}

	.header-badge {
		display: inline-flex;
		align-items: center;
		justify-content: center;
		width: 20px;
		height: 20px;
		border-radius: var(--radius-sm);
		background: var(--color-surface-alt);
		color: var(--color-text-secondary);
		font-size: var(--font-size-xs);
		font-weight: 700;
	}

	.image-badge {
		display: inline-flex;
		align-items: center;
		gap: var(--space-xs);
		padding: 2px var(--space-xs);
		border-radius: var(--radius-sm);
		background: var(--color-primary-dim, color-mix(in srgb, var(--color-primary) 20%, transparent));
		color: var(--color-primary);
		font-size: var(--font-size-xs);
		font-weight: 500;
		margin-right: var(--space-xs);
	}

	/* ── Progress ────────────────────────────────────────────────────────────── */
	.progress-bar {
		height: 6px;
		background: var(--color-surface-alt);
		border-radius: 3px;
		overflow: hidden;
	}
	.progress-bar__fill {
		height: 100%;
		background: var(--color-primary);
		border-radius: 3px;
		transition: width 0.15s ease;
	}
	.progress-text {
		margin: 0;
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
		text-align: center;
	}

	/* ── Error ───────────────────────────────────────────────────────────────── */
	.error-text {
		font-size: var(--font-size-sm);
		color: var(--color-danger);
		margin: 0;
	}

	/* ── Import results ──────────────────────────────────────────────────────── */
	.import-results {
		background: var(--color-surface);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-md);
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}
	.import-results__row {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}
	.import-results__icon {
		flex-shrink: 0;
	}
	.import-results__icon--success {
		color: var(--color-success, #22c55e);
	}
	.import-results__icon--skipped {
		color: var(--color-text-secondary);
	}
	.import-results__text {
		font-size: var(--font-size-sm);
		color: var(--color-text-primary);
	}
	.import-results__text strong {
		font-weight: 600;
	}

	/* ── Action buttons ───────────────────────────────────────────────────────── */
	.action-buttons {
		display: flex;
		gap: var(--space-sm);
	}
	.action-buttons .pill-btn {
		flex: 1;
	}
</style>
