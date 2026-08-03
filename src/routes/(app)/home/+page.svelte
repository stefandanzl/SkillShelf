<script lang="ts">
	import { t } from '$lib/i18n';
	import Avatar from '$lib/components/ui/Avatar.svelte';
	import IconButton from '$lib/components/ui/IconButton.svelte';
	import CircularProgress from '$lib/components/ui/CircularProgress.svelte';
	import Sheet from '$lib/components/ui/Sheet.svelte';
	import PillButton from '$lib/components/ui/PillButton.svelte';
	import CourseEdit from '$lib/components/ui/CourseEdit.svelte';
	import { goto } from '$app/navigation';
	import { pb } from '$lib/pocketbase.svelte';
	import { createBox } from '$lib/api';
	import CourseSelect from '$lib/components/ui/CourseSelect.svelte';
	import { BOX_COLOR_MAP } from '$lib/leitner';
	import { BoxesColorOptions, BoxesLearnDirectionOptions } from '$lib/pocketbase-types';
	import type { CoursesRecord } from '$lib/pocketbase-types';

	let { data } = $props();

	let courses = $state<CoursesRecord[]>(data.courses ?? []);

	// ── Course edit modal ─────────────────────────────────────────────────────────
	let showEditCourse = $state(false);
	let selectedCourse = $state<CoursesRecord | null>(null);

	function openCourseEdit(course: CoursesRecord) {
		selectedCourse = course;
		showEditCourse = true;
	}

	function handleCourseDeleted(courseId: string) {
		courses = courses.filter((c) => c.id !== courseId);
	}

	function handleCourseUpdated(updated: CoursesRecord) {
		const idx = courses.findIndex((c) => c.id === updated.id);
		if (idx !== -1) {
			courses[idx] = updated;
		}
	}

	// ── View toggle ──────────────────────────────────────────────────────────────
	let groupedView = $state(true);

	// ── Expanded courses (localStorage: only expanded IDs stored, collapsed is default) ──
	const STORAGE_KEY = 'skillshelf_expanded_courses';

	function loadExpandedIds(): Set<string> {
		try {
			const raw = localStorage.getItem(STORAGE_KEY);
			return raw ? new Set(JSON.parse(raw)) : new Set();
		} catch {
			return new Set();
		}
	}

	function saveExpandedIds(ids: Set<string>) {
		try {
			localStorage.setItem(STORAGE_KEY, JSON.stringify([...ids]));
		} catch {}
	}

	let expandedCourseIds = $state<Set<string>>(loadExpandedIds());

	function toggleCourse(id: string) {
		const next = new Set(expandedCourseIds);
		if (next.has(id)) {
			next.delete(id);
		} else {
			next.add(id);
		}
		expandedCourseIds = next;
		saveExpandedIds(next);
	}

	// ── Grouped data ─────────────────────────────────────────────────────────────
	const courseMap = $derived(new Map(courses.map((c: any) => [c.id, c])));

	const grouped = $derived.by(() => {
		const summaries = data.boxSummaries ?? [];

		const sortedCourses = [...courses].sort((a: any, b: any) => a.name.localeCompare(b.name));

		const byCourse = new Map<string, typeof summaries>();
		const uncategorized: typeof summaries = [];

		for (const s of summaries) {
			const courseId = s.box.course;
			if (courseId) {
				if (!byCourse.has(courseId)) byCourse.set(courseId, []);
				byCourse.get(courseId)!.push(s);
			} else {
				uncategorized.push(s);
			}
		}

		return { sortedCourses, byCourse, uncategorized };
	});

	// ── Create box form ──────────────────────────────────────────────────────────
	let showCreateBox = $state(false);
	let newBoxName = $state('');
	let selectedColor = $state<BoxesColorOptions>(BoxesColorOptions.blue);
	let selectedCourseId = $state('');
	let creating = $state(false);
	let createError = $state('');

	const username = $derived(
		(pb.authStore.record as any)?.name ||
			(pb.authStore.record as any)?.email ||
			data?.user?.name ||
			data?.user?.email ||
			'User'
	);

	const boxColors: BoxesColorOptions[] = Object.values(BoxesColorOptions);

	const totalDue = $derived((data.boxSummaries ?? []).reduce((s: number, b: any) => s + b.dueCount, 0));

	async function handleAddBox() {
		if (!newBoxName.trim()) return;
		creating = true;
		createError = '';
		try {
			const box = await createBox(pb as any, {
				name: newBoxName.trim(),
				color: selectedColor,
				learn_direction: BoxesLearnDirectionOptions.front_to_back,
				course: selectedCourseId || undefined
			});
			showCreateBox = false;
			newBoxName = '';
			selectedCourseId = '';
			await goto(`/boxes/${box.id}`);
		} catch (e: any) {
			createError = e?.message ?? 'Failed to create box';
		} finally {
			creating = false;
		}
	}
</script>

<div class="home">
	<header class="home__header">
		<div class="home__user">
			<Avatar name={username} size={40} />
			<div class="home__user-text">
				<span class="home__greeting">{$t('home.greeting')}</span>
				<span class="home__username">{username}</span>
			</div>
		</div>
		<div class="home__header-actions">
			<button
				class="view-toggle"
				class:view-toggle--active={!groupedView}
				onclick={() => (groupedView = !groupedView)}
				title={groupedView ? 'Switch to flat view' : 'Switch to grouped view'}
			>
				{#if groupedView}
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
						<line x1="8" y1="6" x2="21" y2="6"></line><line x1="8" y1="12" x2="21" y2="12"></line><line
							x1="8"
							y1="18"
							x2="21"
							y2="18"
						></line>
						<line x1="3" y1="6" x2="3.01" y2="6"></line><line x1="3" y1="12" x2="3.01" y2="12"></line><line
							x1="3"
							y1="18"
							x2="3.01"
							y2="18"
						></line>
					</svg>
				{:else}
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
						<rect x="3" y="3" width="7" height="7"></rect><rect x="14" y="3" width="7" height="7"></rect>
						<rect x="3" y="14" width="7" height="7"></rect><rect x="14" y="14" width="7" height="7"></rect>
					</svg>
				{/if}
			</button>
			<IconButton onclick={() => (showCreateBox = true)} title={$t('box.add_title')}>
				<svg
					width="20"
					height="20"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="2.5"
					stroke-linecap="round"
					stroke-linejoin="round"
				>
					<line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line>
				</svg>
			</IconButton>
		</div>
	</header>

	<p class="home__status">
		{totalDue === 0 ? $t('home.no_cards_due') : `${totalDue} cards due today`}
	</p>

	{#if !groupedView}
		<!-- Flat list view -->
		<div class="home__boxes">
			{#each data.boxSummaries ?? [] as summary (summary.box.id)}
				{@render boxCard(summary)}
			{/each}
			{#if (data.boxSummaries ?? []).length === 0}
				<div class="home__empty"><p>No boxes yet. Tap + to create your first one!</p></div>
			{/if}
		</div>
	{:else}
		<!-- Grouped view -->
		<div class="home__grouped">
			{#each grouped.sortedCourses as course (course.id)}
				{@const boxes = grouped.byCourse.get(course.id) ?? []}
				{#if boxes.length > 0}
					<div class="course-section" style="border-color: {course.color || 'transparent'};">
						<div class="course-header">
							<button class="course-header__toggle" onclick={() => toggleCourse(course.id)}>
								<svg
									class="course-chevron"
									class:course-chevron--open={expandedCourseIds.has(course.id)}
									width="16"
									height="16"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2.5"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<polyline points="9 18 15 12 9 6"></polyline>
								</svg>
								<span class="course-header__name">{course.name}</span>
								<span class="course-header__count">{boxes.length}</span>
							</button>
							<button class="course-edit-btn" onclick={() => openCourseEdit(course)} aria-label="Edit course">
								<svg
									width="12"
									height="12"
									viewBox="0 0 24 24"
									fill="none"
									stroke="currentColor"
									stroke-width="2"
									stroke-linecap="round"
									stroke-linejoin="round"
								>
									<path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
									<path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
								</svg>
							</button>
						</div>

						{#if expandedCourseIds.has(course.id)}
							<div class="course-boxes">
								{#each boxes as summary (summary.box.id)}
									{@render boxCard(summary)}
								{/each}
							</div>
						{/if}
					</div>
				{/if}
			{/each}

			{#if grouped.uncategorized.length > 0}
				<div class="home__boxes">
					{#each grouped.uncategorized as summary (summary.box.id)}
						{@render boxCard(summary)}
					{/each}
				</div>
			{/if}

			{#if (data.boxSummaries ?? []).length === 0}
				<div class="home__empty"><p>No boxes yet. Tap + to create your first one!</p></div>
			{/if}
		</div>
	{/if}
</div>

{#snippet boxCard(summary: any)}
	<button class="topic-card" onclick={() => goto(`/boxes/${summary.box.id}`)}>
		<div
			class="topic-card__accent"
			style="background: {BOX_COLOR_MAP[summary.box.color ?? BoxesColorOptions.blue] ?? 'var(--color-primary)'}"
		></div>
		<div class="topic-card__body">
			<div class="topic-card__top">
				<span class="topic-card__name">{summary.box.name}</span>
				<CircularProgress
					value={summary.completionPct}
					size={44}
					color={BOX_COLOR_MAP[summary.box.color ?? BoxesColorOptions.blue] ?? 'var(--color-primary)'}
				/>
			</div>
			<div class="topic-card__bottom">
				<svg
					width="16"
					height="16"
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
				<span class="topic-card__count">
					{summary.totalCards} /
					<span class="topic-card__due" class:topic-card__due--active={summary.dueCount > 0}>{summary.dueCount}</span>
				</span>
			</div>
		</div>
	</button>
{/snippet}

<Sheet open={showCreateBox} title={$t('box.add_title')} onclose={() => (showCreateBox = false)}>
	{#snippet children()}
		<div class="create-box">
			<div class="create-box__form">
				<label class="create-box__label" for="box-name">{$t('box.name_label')}</label>
				<input
					id="box-name"
					class="create-box__input"
					type="text"
					placeholder={$t('box.name_placeholder')}
					bind:value={newBoxName}
					maxlength={80}
				/>
				<div class="create-box__char-count">{newBoxName.length}/80</div>

				<label class="create-box__label">{$t('box.color')}</label>
				<div class="color-picker">
					{#each boxColors as c}
						<button
							class="color-dot"
							class:color-dot--active={selectedColor === c}
							style="background: {BOX_COLOR_MAP[c]}"
							onclick={() => (selectedColor = c)}
							aria-label={c}
						></button>
					{/each}
				</div>

				<label class="create-box__label" for="box-course">Course</label>
				<CourseSelect
					{courses}
					value={selectedCourseId}
					onchange={(id) => (selectedCourseId = id)}
					oncreated={(c) => (courses = [...courses, c])}
				/>
			</div>
			{#if createError}<p class="create-box__error">{createError}</p>{/if}
			<PillButton onclick={handleAddBox} disabled={!newBoxName.trim() || creating}>
				{creating ? 'Creating…' : $t('box.add_button')}
			</PillButton>
		</div>
	{/snippet}
</Sheet>

{#if selectedCourse}
	<CourseEdit
		open={showEditCourse}
		course={selectedCourse}
		onclose={() => (showEditCourse = false)}
		ondeleted={() => handleCourseDeleted(selectedCourse.id)}
		onupdated={(c) => handleCourseUpdated(c)}
	/>
{/if}

<style>
	.home {
		padding: var(--space-md);
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}
	.home__header {
		display: flex;
		align-items: center;
		justify-content: space-between;
		padding-top: var(--space-sm);
	}
	.home__header-actions {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
	}
	.home__user {
		display: flex;
		align-items: center;
		gap: var(--space-sm);
	}
	.home__user-text {
		display: flex;
		flex-direction: column;
	}
	.home__greeting {
		font-size: var(--font-size-sm);
		color: var(--color-text-secondary);
	}
	.home__username {
		font-size: var(--font-size-base);
		font-weight: 700;
		color: var(--color-text-primary);
	}
	.home__status {
		font-size: var(--font-size-md);
		color: var(--color-text-primary);
		margin: 0;
	}
	.home__boxes {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}
	.home__grouped {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}
	.home__empty {
		text-align: center;
		color: var(--color-text-secondary);
		padding: var(--space-xl);
	}

	/* Course section */
	.course-section {
		display: flex;
		flex-direction: column;
		gap: 0;
		border: 1px solid;
		border-radius: var(--radius-lg);
		/* padding: var(--space-xs); */
	}
	.course-header {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		height: 50px;
	}
	.course-header__toggle {
		flex: 1;
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		padding: var(--space-sm) var(--space-xs);
		background: none;
		border: none;
		cursor: pointer;
		text-align: left;
		color: var(--color-text-primary);
	}
	.course-header__toggle:hover {
		color: var(--color-primary);
	}
	.course-header__toggle:hover .course-header__name {
		color: var(--color-text-primary);
	}
	.course-chevron {
		flex-shrink: 0;
		transition: transform var(--transition-fast);
		color: var(--color-text-secondary);
	}
	.course-chevron--open {
		transform: rotate(90deg);
	}
	.course-header__name {
		flex: 1;
		font-size: var(--font-size-sm);
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.06em;
		color: var(--color-text-secondary);
	}
	.course-header__count {
		font-size: var(--font-size-xs);
		color: var(--color-text-secondary);
		background: var(--color-surface-alt);
		border-radius: var(--radius-sm);
		padding: 2px 6px;
	}
	.course-boxes {
		border: 1px solid var(--color-border);
		border-radius: var(--radius-lg);
		padding: var(--space-sm);
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
		background: var(--color-surface-alt);
	}

	.course-edit-btn {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 28px;
		height: 28px;
		flex-shrink: 0;
		border-radius: var(--radius-sm);
		border: none;
		background: transparent;
		color: var(--color-text-secondary);
		cursor: pointer;
		transition:
			background var(--transition-fast),
			color var(--transition-fast);
	}

	.course-edit-btn:hover {
		background: var(--color-surface-alt);
		color: var(--color-primary);
	}

	/* View toggle */
	.view-toggle {
		display: flex;
		align-items: center;
		justify-content: center;
		width: 36px;
		height: 36px;
		border-radius: var(--radius-md);
		border: none;
		background: none;
		color: var(--color-text-secondary);
		cursor: pointer;
		transition:
			background var(--transition-fast),
			color var(--transition-fast);
	}
	.view-toggle:hover {
		background: var(--color-surface-alt);
		color: var(--color-text-primary);
	}
	.view-toggle--active {
		background: var(--color-surface-alt);
		color: var(--color-primary);
	}

	.topic-card {
		background: var(--color-surface);
		border-radius: var(--radius-lg);
		padding: var(--space-md);
		display: flex;
		align-items: stretch;
		gap: var(--space-md);
		cursor: pointer;
		transition: background var(--transition-fast);
		text-align: left;
		width: 100%;
		box-shadow: var(--shadow-card);
	}
	.topic-card:hover {
		background: var(--color-surface-alt);
	}
	.topic-card__accent {
		width: 4px;
		border-radius: 4px;
		flex-shrink: 0;
		min-height: 60px;
	}
	.topic-card__body {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}
	.topic-card__top {
		display: flex;
		align-items: center;
		justify-content: space-between;
	}
	.topic-card__name {
		font-size: var(--font-size-md);
		font-weight: 700;
		color: var(--color-text-primary);
	}
	.topic-card__bottom {
		display: flex;
		align-items: center;
		gap: var(--space-xs);
		color: var(--color-text-secondary);
		font-size: var(--font-size-sm);
	}
	.topic-card__count {
		color: var(--color-text-secondary);
	}
	.topic-card__due {
		color: var(--color-text-secondary);
	}
	.topic-card__due--active {
		color: var(--color-danger);
	}

	.create-box {
		display: flex;
		flex-direction: column;
		gap: var(--space-md);
	}
	.create-box__form {
		display: flex;
		flex-direction: column;
		gap: var(--space-sm);
	}
	.create-box__label {
		font-size: var(--font-size-sm);
		font-weight: 600;
		color: var(--color-text-secondary);
		text-transform: uppercase;
		letter-spacing: 0.05em;
	}
	.create-box__input {
		background: var(--color-surface-alt);
		border: 1px solid var(--color-border);
		border-radius: var(--radius-md);
		padding: var(--space-md);
		color: var(--color-text-primary);
		width: 100%;
	}
	.create-box__input:focus {
		border-color: var(--color-primary);
		outline: none;
	}
	.create-box__char-count {
		font-size: var(--font-size-xs);
		color: var(--color-text-secondary);
		text-align: right;
	}
	.create-box__error {
		font-size: var(--font-size-sm);
		color: var(--color-danger);
		margin: 0;
	}

	.color-picker {
		display: flex;
		gap: var(--space-sm);
		flex-wrap: wrap;
	}
	.color-dot {
		width: 32px;
		height: 32px;
		border-radius: 50%;
		border: 3px solid transparent;
		transition: border-color var(--transition-fast);
	}
	.color-dot--active {
		border-color: white;
	}
</style>
