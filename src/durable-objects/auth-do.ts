import { DurableObject } from 'cloudflare:workers';
import { sha256 } from '@noble/hashes/sha256';
import { bytesToHex } from '@stacks/common';
import { verifyMessageSignatureRsv } from '@stacks/encryption';
import {
	encodeStructuredData,
	getAddressFromPublicKey,
	publicKeyFromSignatureRsv,
	stringAsciiCV,
	tupleCV,
	uintCV,
	validateStacksAddress,
} from '@stacks/transactions';
import { Env } from '../../worker-configuration';
import { AppConfig } from '../config';
import { createJsonResponse } from '../utils/requests-responses';

/**
 * Durable Object class for authentication
 */
export class AuthDO extends DurableObject<Env> {
	private readonly CACHE_TTL = 43200; // 30 days, in seconds
	private readonly ALARM_INTERVAL_MS: number;
	private readonly BASE_PATH = '/auth';
	private readonly KEY_PREFIX = 'auth';
	private readonly SUPPORTED_ENDPOINTS: string[] = ['/request-auth-token', '/verify-address', '/verify-session-token'];

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.ctx = ctx;
		this.env = env;

		// Initialize AppConfig with environment
		const config = AppConfig.getInstance(env).getConfig();
		this.ALARM_INTERVAL_MS = config.ALARM_INTERVAL_MS;

		// Set up alarm to run at configured interval
		ctx.storage.setAlarm(Date.now() + this.ALARM_INTERVAL_MS);
	}

	async alarm(): Promise<void> {
		try {
			console.log(`AuthDO: alarm activated`);
		} catch (error) {
			console.error(`AuthDO: alarm execution failed: ${error instanceof Error ? error.message : String(error)}`);
		} finally {
			// Always schedule next alarm if one isn't set
			const currentAlarm = await this.ctx.storage.getAlarm();
			if (currentAlarm === null) {
				this.ctx.storage.setAlarm(Date.now() + this.ALARM_INTERVAL_MS);
			}
		}
	}

	private async validateAuth(request: Request): Promise<{ success: boolean; error?: string; status?: number }> {
		if (!request.headers.has('Authorization')) {
			return { success: false, error: 'Missing Authorization header', status: 401 };
		}

		const frontendKey = await this.env.AIBTCDEV_SERVICES_KV.get('key:aibtcdev-frontend');
		const backendKey = await this.env.AIBTCDEV_SERVICES_KV.get('key:aibtcdev-backend');

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

	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;

		if (!path.startsWith(this.BASE_PATH)) {
			return createJsonResponse(
				{
					error: `Request at ${path} does not start with base path ${this.BASE_PATH}`,
				},
				404
			);
		}

		// Remove base path to get the endpoint
		const endpoint = path.replace(this.BASE_PATH, '');

		// Handle root path
		if (endpoint === '' || endpoint === '/') {
			return createJsonResponse({
				message: `Supported endpoints: ${this.SUPPORTED_ENDPOINTS.join(', ')}`,
			});
		}

		// all methods from this point forward require a shared key
		// frontend and backend each have their own stored in KV
		const authResult = await this.validateAuth(request);
		if (!authResult.success) {
			return createJsonResponse({ error: authResult.error }, authResult.status);
		}

		// all methods from this point forward are POST
		if (request.method !== 'POST') {
			return createJsonResponse(
				{
					error: `Unsupported method: ${request.method}, supported method: POST`,
				},
				405
			);
		}

		if (endpoint === '/request-auth-token') {
			// get signature from body
			const body = await request.json();
			if (!body || typeof body !== 'object' || !('data' in body)) {
				return createJsonResponse(
					{
						error: 'Missing or invalid "data" in request body',
					},
					400
				);
			}
			const signedMessage = String(body.data);
			// try to verify signature
			try {
				// TODO: this needs a home, corresponds with front-end settings
				// might fail signature check if it does not match
				const expectedDomain = tupleCV({
					name: stringAsciiCV('sprint.aibtc.dev'),
					version: stringAsciiCV('0.0.1'),
					'chain-id': uintCV(1), // hardcoded mainnet, testnet is u2147483648
				});
				// same here this has to match front-end
				const expectedMessage = stringAsciiCV('Welcome to aibtcdev!');
				const encodedMessage = encodeStructuredData({ message: expectedMessage, domain: expectedDomain });
				const encodedMessageHashed = sha256(encodedMessage);
				// get public key from signature
				const publicKey = publicKeyFromSignatureRsv(bytesToHex(encodedMessageHashed), signedMessage);
				// verify signature
				const isSignatureVerified = verifyMessageSignatureRsv({
					signature: signedMessage, // what they sent us
					message: encodedMessageHashed, // what we expect
					publicKey: publicKey, // public key from signature
				});
				if (!isSignatureVerified) {
					return createJsonResponse(
						{
							error: `Failed to verify signature ${signedMessage}`,
						},
						401
					);
				}
				// get address from public key
				const addressFromPublicKey = getAddressFromPublicKey(publicKey, 'mainnet');
				// verify valid stacks address returned
				if (!validateStacksAddress(addressFromPublicKey)) {
					return createJsonResponse(
						{
							error: `Failed to get address from public key ${publicKey}`,
						},
						401
					);
				}
				// add address to kv key list with unique session key
				// expires after 30 days and requires new signature from user
				// signing before expiration extends the expiration
				const sessionToken = crypto.randomUUID();
				// first key allows us to filter by address
				this.env.AIBTCDEV_SERVICES_KV.put(`${this.KEY_PREFIX}:address:${addressFromPublicKey}`, sessionToken, {
					expirationTtl: this.CACHE_TTL,
				});
				// second key allows us to filter by session key
				this.env.AIBTCDEV_SERVICES_KV.put(`${this.KEY_PREFIX}:session:${sessionToken}`, addressFromPublicKey, {
					expirationTtl: this.CACHE_TTL,
				});
				// return 200 with session token
				return createJsonResponse({
					message: 'auth token successfully created',
					address: addressFromPublicKey,
					sessionToken,
				});
			} catch (error) {
				return createJsonResponse(
					{
						error: `Failed to verify signature ${signedMessage}: ${error instanceof Error ? error.message : String(error)}`,
					},
					401
				);
			}
		}

		if (endpoint === '/verify-address') {
			// get address from body
			const body = await request.json();
			if (!body || typeof body !== 'object' || !('data' in body)) {
				return createJsonResponse(
					{
						error: 'Missing or invalid "data" in request body',
					},
					400
				);
			}
			const address = String(body.data);
			const validAddress = validateStacksAddress(address);
			if (!validAddress) {
				return createJsonResponse(
					{
						error: `Invalid address ${address}`,
					},
					400
				);
			}
			// get session key from kv key list
			const sessionKey = await this.env.AIBTCDEV_SERVICES_KV.get(`${this.KEY_PREFIX}:address:${address}`);
			if (sessionKey === null) {
				return createJsonResponse(
					{
						error: `Address ${address} not found in key list`,
					},
					401
				);
			}
			// return 200 with session info
			return createJsonResponse({
				message: 'address successfully verified',
				address,
				sessionKey,
			});
		}

		if (endpoint === '/verify-session-token') {
			// get session key from body
			const body = await request.json();
			if (!body || typeof body !== 'object' || !('data' in body)) {
				return createJsonResponse(
					{
						error: 'Missing or invalid "data" in request body',
					},
					400
				);
			}
			const sessionToken = String(body.data);
			// get address from kv key list
			const address = await this.env.AIBTCDEV_SERVICES_KV.get(`${this.KEY_PREFIX}:session:${sessionToken}`);
			if (address === null) {
				return createJsonResponse(
					{
						error: `Session key ${sessionToken} not found in key list`,
					},
					401
				);
			}
			// return 200 with session info
			return createJsonResponse({
				message: 'session token successfully verified',
				address,
				sessionToken,
			});
		}

		// TODO: endpoint to revoke a session token

		return createJsonResponse(
			{
				error: `Unsupported endpoint: ${endpoint}, supported endpoints: ${this.SUPPORTED_ENDPOINTS.join(', ')}`,
			},
			404
		);
	}
}
