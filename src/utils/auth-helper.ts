import { Env } from '../../worker-configuration';

type SharedKeySuccess = { success: true };
type SharedKeyFailure = { success: false; error: string; status: number };

export async function validateSharedKeyAuth(env: Env, request: Request): Promise<SharedKeySuccess | SharedKeyFailure> {
	if (!request.headers.has('Authorization')) {
		return { success: false, error: 'Missing Authorization header', status: 401 };
	}

	const frontendKey = await env.AIBTCDEV_SERVICES_KV.get('key:aibtcdev-frontend');
	const backendKey = await env.AIBTCDEV_SERVICES_KV.get('key:aibtcdev-backend');

	if (frontendKey === null || backendKey === null) {
		return {
			success: false,
			error: 'Unable to load shared keys for frontend/backend',
			status: 401,
		};
	}

	const validKeys = [frontendKey, backendKey];
	const requestKey = request.headers.get('Authorization');

	if (requestKey === null || !validKeys.includes(requestKey)) {
		return { success: false, error: 'Invalid Authorization key', status: 401 };
	}

	return { success: true };
}

type SessionTokenResponse = { success: boolean; address?: string; error?: string };

export async function validateSessionToken(env: Env, sessionToken: string): Promise<SessionTokenResponse> {
	const address = await env.AIBTCDEV_SERVICES_KV.get(`auth:session:${sessionToken}`);
	if (!address) {
		return { success: false, error: 'Invalid or expired session token' };
	}
	return { success: true, address };
}
