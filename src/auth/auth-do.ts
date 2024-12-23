import { DurableObject } from 'cloudflare:workers';
import { verifyMessageSignatureRsv } from '@stacks/encryption';
import { getAddressFromPublicKey, validateStacksAddress } from '@stacks/transactions';
import { Env } from '../../worker-configuration';
import { AppConfig } from '../config';
import { createApiResponse, createUnsupportedEndpointResponse } from '../utils/requests-responses';
import { validateSharedKeyAuth } from '../utils/auth-helper';

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
		// ctx.storage.setAlarm(Date.now() + this.ALARM_INTERVAL_MS);
	}

	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;

		if (!path.startsWith(this.BASE_PATH)) {
			return createApiResponse(`Request at ${path} does not start with base path ${this.BASE_PATH}`, 404);
		}

		// Remove base path to get the endpoint
		const endpoint = path.replace(this.BASE_PATH, '');

		// Handle root path
		if (endpoint === '' || endpoint === '/') {
			return createApiResponse({
				message: 'auth service',
				data: {
					endpoints: this.SUPPORTED_ENDPOINTS,
				},
			});
		}

		// all methods from this point forward require a shared key
		// frontend and backend each have their own stored in KV
		const authResult = await validateSharedKeyAuth(this.env, request);
		if (!authResult.success) {
			return createApiResponse(authResult.error, authResult.status);
		}

		// all methods from this point forward are POST
		if (request.method !== 'POST') {
			return createApiResponse(`Unsupported method: ${request.method}, supported method: POST`, 405);
		}

		if (endpoint === '/request-auth-token') {
			// get signature from body
			const body = await request.json();
			if (!body || typeof body !== 'object' || !('signature' in body) || !('publicKey' in body)) {
				return createApiResponse('Missing required parameters: signature, publicKey', 400);
			}
			const signedMessage = String(body.signature);
			const publicKey = String(body.publicKey);
			// try to verify signature
			try {
				const expectedMessageText = 'welcome to aibtcdev!';
				const isSignatureVerified = verifyMessageSignatureRsv({
					signature: signedMessage, // what they sent us
					message: expectedMessageText, // what we expect
					publicKey, // public key from signature
				});
				const addressFromPubkey = getAddressFromPublicKey(publicKey, 'mainnet');
				const isAddressValid = validateStacksAddress(addressFromPubkey);
				// check if signature is valid with the public key
				if (!isSignatureVerified) {
					return createApiResponse(`Signature verification failed for public key ${publicKey}`, 401);
				}
				// check if address is valid
				if (!isAddressValid) {
					return createApiResponse(`Invalid address ${addressFromPubkey} from public key ${publicKey}`, 400);
				}
				// add address to kv key list with unique session key
				// expires after 30 days and requires new signature from user
				// signing before expiration extends the expiration
				const sessionToken = crypto.randomUUID();
				// allow lookup of pubkey from address
				const savePubkey = this.env.AIBTCDEV_SERVICES_KV.put(`${this.KEY_PREFIX}:pubkey:${addressFromPubkey}`, publicKey, {
					expirationTtl: this.CACHE_TTL,
				});
				// allow lookup of address from session token
				const saveSessionToken = this.env.AIBTCDEV_SERVICES_KV.put(`${this.KEY_PREFIX}:session:${sessionToken}`, addressFromPubkey, {
					expirationTtl: this.CACHE_TTL,
				});
				// allow lookup of session token from address
				const saveAddress = this.env.AIBTCDEV_SERVICES_KV.put(`${this.KEY_PREFIX}:address:${addressFromPubkey}`, sessionToken, {
					expirationTtl: this.CACHE_TTL,
				});
				// wait for all kv operations to complete
				await Promise.all([savePubkey, saveSessionToken, saveAddress]);
				// return 200 with session token
				return createApiResponse({
					message: 'Successfully created auth token',
					data: {
						address: addressFromPubkey,
						sessionToken,
					},
				});
			} catch (error) {
				return createApiResponse(`Failed to verify signature: ${error instanceof Error ? error.message : String(error)}`, 401);
			}
		}

		if (endpoint === '/verify-address') {
			// get address from body
			const body = await request.json();
			if (!body || typeof body !== 'object' || !('data' in body)) {
				return createApiResponse('Missing required parameter: data', 400);
			}
			const address = String(body.data);
			const validAddress = validateStacksAddress(address);
			if (!validAddress) {
				return createApiResponse(`Invalid address: ${address}`, 400);
			}
			// get session key from kv key list
			const sessionKey = await this.env.AIBTCDEV_SERVICES_KV.get(`${this.KEY_PREFIX}:address:${address}`);
			if (sessionKey === null) {
				return createApiResponse(`Address not found: ${address}`, 401);
			}
			// return 200 with session info
			return createApiResponse({
				message: 'Successfully verified address',
				data: {
					address,
					sessionKey,
				},
			});
		}

		if (endpoint === '/verify-session-token') {
			// get session key from body
			const body = await request.json();
			if (!body || typeof body !== 'object' || !('data' in body)) {
				return createApiResponse('Missing or invalid "data" in request body', 400);
			}
			const sessionToken = String(body.data);
			// get address from kv key list
			const address = await this.env.AIBTCDEV_SERVICES_KV.get(`${this.KEY_PREFIX}:session:${sessionToken}`);
			if (address === null) {
				return createApiResponse(`Invalid session token: ${sessionToken}`, 401);
			}
			// return 200 with session info
			return createApiResponse({
				message: 'Successfully verified session token',
				data: {
					address,
					sessionToken,
				},
			});
		}

		// TODO: endpoint to revoke a session token

		return createUnsupportedEndpointResponse(endpoint, this.SUPPORTED_ENDPOINTS);
	}
}
