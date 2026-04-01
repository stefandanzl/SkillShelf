import type { CardsRecord, CardProgressRecord } from '$lib/pocketbase-types';

type StudyEntry = { card: CardsRecord; progress: CardProgressRecord | null };

let prefetchedCards = $state<StudyEntry[] | null>(null);

export function setStudyCards(cards: StudyEntry[]) {
	prefetchedCards = cards;
}

export function consumeStudyCards(): StudyEntry[] | null {
	const cards = prefetchedCards;
	prefetchedCards = null;
	return cards;
}
