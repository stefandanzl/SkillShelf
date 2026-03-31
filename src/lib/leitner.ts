import type { CardProgressRecord } from './pocketbase-types';

const LEVEL_INTERVALS_DAYS: Record<number, number> = {
	1: 1,
	2: 2,
	3: 4,
	4: 8,
	5: 16,
	6: 32,
	7: 64
};

export function getNextReviewDate(level: number): Date {
	const days = LEVEL_INTERVALS_DAYS[level] ?? 1;
	const date = new Date();
	date.setDate(date.getDate() + days);
	date.setHours(0, 0, 0, 0);
	return date;
}

export function processAnswer(
	current: Pick<CardProgressRecord, 'level' | 'streak'>,
	wasCorrect: boolean
): { level: number; mastered: boolean; last_reviewed: string; next_review: string; streak: number } {
	if (wasCorrect) {
		const newLevel = Math.min((current.level ?? 0) + 1, 7);
		return {
			level: newLevel,
			mastered: newLevel >= 7,
			last_reviewed: new Date().toISOString(),
			next_review: getNextReviewDate(newLevel).toISOString(),
			streak: (current.streak ?? 0) + 1
		};
	} else {
		const newLevel = Math.max((current.level ?? 1) - 1, 1);
		return {
			level: newLevel,
			mastered: false,
			last_reviewed: new Date().toISOString(),
			next_review: getNextReviewDate(newLevel).toISOString(),
			streak: 0
		};
	}
}

export function isDueToday(nextReview: string | null | undefined): boolean {
	if (!nextReview) return true;
	return new Date(nextReview) <= new Date();
}

export const LEVEL_COLORS: Record<number, string> = {
	1: 'var(--color-topic-red)',
	2: 'var(--color-topic-orange)',
	3: 'var(--color-topic-orange)',
	4: 'var(--color-topic-blue)',
	5: 'var(--color-topic-blue)',
	6: 'var(--color-topic-green)',
	7: 'var(--color-topic-green)'
};

export const BOX_COLOR_MAP: Record<string, string> = {
	red: 'var(--color-topic-red)',
	blue: 'var(--color-topic-blue)',
	green: 'var(--color-topic-green)',
	orange: 'var(--color-topic-orange)',
	purple: 'var(--color-topic-purple)',
	teal: 'var(--color-topic-teal)'
};
