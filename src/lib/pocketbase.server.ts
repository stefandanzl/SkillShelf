import { env } from '$env/dynamic/private'
import type { TypedPocketBase } from './pocketbase-types'
import PocketBase from 'pocketbase'
import { env as privateEnv } from '$env/dynamic/private'
import { dev } from '$app/environment'

// ***** SSR Only: Admin auth for privileged operations ***
export async function createAdminPb(): Promise<TypedPocketBase> {
	// Ensure POCKETBASE_URL is set - fallback to localhost for development
	const pocketbaseUrl = env.POCKETBASE_URL || (dev ? 'http://localhost:8090' : '');
	if (!pocketbaseUrl) {
		throw new Error('POCKETBASE_URL environment variable is not set');
	}

	const adminPb = new PocketBase(pocketbaseUrl) as TypedPocketBase

	const email = privateEnv.POCKETBASE_ADMIN_EMAIL
	const password = privateEnv.POCKETBASE_ADMIN_PASSWORD

	if (!email || !password) {
		throw new Error('POCKETBASE_ADMIN_EMAIL and POCKETBASE_ADMIN_PASSWORD must be set in .env for admin operations')
	}

	await (adminPb as any).collection('_superusers').authWithPassword(email, password)
	return adminPb
}
// ***** End Admin Only ***
