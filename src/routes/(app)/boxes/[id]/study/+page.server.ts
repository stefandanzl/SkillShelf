import { error, redirect } from '@sveltejs/kit';

export const load = async ({ locals, params }) => {
	if (!locals.user) {
		redirect(307, '/sign/in');
	}

	const pb = locals.pb;

	try {
		// Verify the box exists and user owns it
		const box = await pb.collection('boxes').getOne(params.id);
		if (box.owner !== pb.authStore.record?.id) {
			error(403, 'You do not have access to this box');
		}

		// Get all cards in box
		const cardsResult = await pb.collection('cards').getList(1, 500, {
			filter: `box = "${params.id}"`,
			sort: 'sort_order,created'
		});
		const cards = cardsResult.items;

		// Get all progress records for this box
		const progressResult = await pb.collection('card_progress').getList(1, 500, {
			filter: `box = "${params.id}"`
		});
		const progressList = progressResult.items;

		const progressMap = new Map(progressList.map((p) => [p.card, p]));

		const now = new Date();
		const dueCards = [];

		for (const card of cards) {
			const progress = progressMap.get(card.id) ?? null;
			// No progress = never reviewed = always due
			if (!progress) {
				dueCards.push({ card, progress: null });
				continue;
			}
			if (!progress.mastered) {
				const nextReview = progress.next_review ? new Date(progress.next_review) : null;
				if (!nextReview || nextReview <= now) {
					dueCards.push({ card, progress });
				}
			}
		}

		return { dueCards, boxId: params.id };
	} catch (e) {
		error(404, 'Box not found');
	}
};
