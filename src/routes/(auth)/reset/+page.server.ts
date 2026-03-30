
export const actions = {
	default: async ({ locals, request }) => {
		const form = Object.fromEntries(await request.formData()) as {
			email: string;
		};

		try {
			const result = await locals.pb.collection('users').requestPasswordReset(form.email);
			return { success: result, email: form.email };
		} catch (e) {
			console.error(e);
			const err = e as import('pocketbase').ClientResponseError;
			return { error: err.message || 'Failed to send reset email.' };
		}
	}
};
