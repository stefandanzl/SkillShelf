import { error, redirect } from '@sveltejs/kit';

export const load = async ({ locals, params }) => {
	if (!locals.user) {
		redirect(307, '/sign/in');
	}

	const pb = locals.pb;

	try {
		const card = await pb.collection('cards').getOne(params.cardId);

		// Verify user owns the box this card belongs to
		const box = await pb.collection('boxes').getOne(card.box);
		if (box.owner !== pb.authStore.record?.id) {
			error(403, 'You do not have access to this card');
		}

		const progressList = await pb.collection('card_progress').getList(1, 1, {
			filter: `card = "${params.cardId}"`,
		});
		const progress = progressList.items[0] ?? null;

		return { card, progress };
	} catch {
		error(404, 'Card not found');
	}
};
