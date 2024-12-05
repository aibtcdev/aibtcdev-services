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
// import { AppConfig } from '../config';
import { createJsonResponse } from '../utils/requests-responses';

/**
 * Durable Object class for authentication
 */
export class AuthDO extends DurableObject<Env> {
	private readonly CACHE_TTL = 43200; // 30 days, in seconds
	// private readonly ALARM_INTERVAL_MS: number;
	private readonly BASE_PATH: string = '/auth';
	private readonly CACHE_PREFIX: string = this.BASE_PATH.replaceAll('/', '');
	private readonly SUPPORTED_ENDPOINTS: string[] = ['/request-auth-token', '/verify-address', '/verify-session-token'];

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.ctx = ctx;
		this.env = env;

		// Initialize AppConfig with environment
		// const config = AppConfig.getInstance(env).getConfig();
		// this.CACHE_TTL = config.CACHE_TTL;
		// this.ALARM_INTERVAL_MS = config.ALARM_INTERVAL_MS;

		// Set up alarm to run at configured interval
		// ctx.storage.setAlarm(Date.now() + this.ALARM_INTERVAL_MS);
	}

	/* Uncomment with setAlarm above to enable alarm that fires off on interval from config or custom value

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

	*/

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

		if (endpoint === '/request-auth-token') {
			// TODO: can restrict to shared secret as auth bearer token
			// accepts POST with signedMessage in body
			if (request.method !== 'POST') {
				return createJsonResponse(
					{
						error: `Unsupported method: ${request.method}, supported method: POST`,
					},
					405
				);
			}
			// get signature from body
			const body = await request.json();
			if (!body || typeof body !== 'object' || !('signedMessage' in body)) {
				return createJsonResponse(
					{
						error: 'Missing or invalid "signedMessage" in request body',
					},
					400
				);
			}
			const signedMessage = String(body.signedMessage);
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
				const sessionKey = crypto.randomUUID();
				// first key allows us to filter by address
				this.env.AIBTCDEV_SERVICES_KV.put(`address:${addressFromPublicKey}`, sessionKey, { expirationTtl: this.CACHE_TTL });
				// second key allows us to filter by session key
				this.env.AIBTCDEV_SERVICES_KV.put(`session:${sessionKey}`, addressFromPublicKey, { expirationTtl: this.CACHE_TTL });
				// return 200 with session token
				return createJsonResponse({
					message: 'auth token successfully created',
					address: addressFromPublicKey,
					sessionKey,
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
			// TODO: can restrict to shared secret as auth bearer token
			// accepts POST with address in body
			if (request.method !== 'POST') {
				return createJsonResponse(
					{
						error: `Unsupported method: ${request.method}, supported method: POST`,
					},
					405
				);
			}
			// get address from body
			const body = await request.json();
			if (!body || typeof body !== 'object' || !('address' in body)) {
				return createJsonResponse(
					{
						error: 'Missing or invalid "address" in request body',
					},
					400
				);
			}
			const address = String(body.address);
			// get session key from kv key list
			const sessionKey = await this.env.AIBTCDEV_SERVICES_KV.get(`address:${address}`);
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
			// TODO: can restrict to shared secret as auth bearer token
			// accepts POST with sessionKey in body
			if (request.method !== 'POST') {
				return createJsonResponse(
					{
						error: `Unsupported method: ${request.method}, supported method: POST`,
					},
					405
				);
			}

			// get session key from body
			const body = await request.json();
			if (!body || typeof body !== 'object' || !('sessionKey' in body)) {
				return createJsonResponse(
					{
						error: 'Missing or invalid "sessionKey" in request body',
					},
					400
				);
			}
			const sessionKey = String(body.sessionKey);
			// get address from kv key list
			const address = await this.env.AIBTCDEV_SERVICES_KV.get(`session:${sessionKey}`);
			if (address === null) {
				return createJsonResponse(
					{
						error: `Session key ${sessionKey} not found in key list`,
					},
					401
				);
			}
			// return 200 with session info
			return createJsonResponse({
				message: 'session token successfully verified',
				address,
				sessionKey,
			});
		}

		return createJsonResponse(
			{
				error: `Unsupported endpoint: ${endpoint}, supported endpoints: ${this.SUPPORTED_ENDPOINTS.join(', ')}`,
			},
			404
		);
	}
}
