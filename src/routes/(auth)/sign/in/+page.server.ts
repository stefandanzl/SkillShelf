import { redirect } from '@sveltejs/kit';

export const load = async ({ locals }) => {
	if (locals.user) {
		redirect(307, '/home');
	}
};

export const actions = {
	default: async ({ locals, request }) => {
		const form = Object.fromEntries(await request.formData()) as {
			username: string;
			password: string;
		};

		try {
			await locals.pb.collection('users').authWithPassword(form.username, form.password);
		} catch (e) {
			const err = e as import('pocketbase').ClientResponseError;
			return { error: err.message || 'Failed to authenticate.' };
		}

		// Redirect to home if verified, otherwise to /verify
		if (locals.pb.authStore.model?.verified) {
			redirect(307, '/home');
		} else {
			redirect(307, '/verify');
		}
	}
};
