import type { Reroute, Transport } from '@sveltejs/kit';
import type { Handle } from '@sveltejs/kit';

export const reroute: Reroute = ({ url }) => {
	if (url.hostname !== 'localhost') {
		return '/' + url.hostname + url.pathname;
	}
	return url.pathname;
};

export const handle: Handle = async ({ event, resolve }) => {
	const { url } = event;

	if (url.hostname !== 'localhost') {
		const newPath = '/' + url.hostname + url.pathname;

		return Response.redirect(new URL(newPath, url.origin), 302);
	}

	return resolve(event);
};

export const transport: Transport = {};
