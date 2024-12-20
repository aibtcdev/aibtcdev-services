import { DurableObject } from 'cloudflare:workers';
import { Env } from '../../worker-configuration';
import { createApiResponse } from '../utils/requests-responses';
import { validateSharedKeyAuth } from '../utils/auth-helper';
import { AppConfig } from '../config';

export class CdnDO extends DurableObject<Env> {
	private readonly ALARM_INTERVAL_MS: number;
	private readonly BASE_PATH = '/cdn';
	private readonly KEY_PREFIX = 'cdn';
	private readonly SUPPORTED_ENDPOINTS: string[] = ['/get', '/list', '/put', '/delete'];

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
			console.log(`CdnDO: alarm activated`);
		} catch (error) {
			console.error(`CdnDO: alarm execution failed: ${error instanceof Error ? error.message : String(error)}`);
		} finally {
			// Always schedule next alarm if one isn't set
			const currentAlarm = await this.ctx.storage.getAlarm();
			if (currentAlarm === null) {
				this.ctx.storage.setAlarm(Date.now() + this.ALARM_INTERVAL_MS);
			}
		}
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
				message: 'Welcome to CDN service',
				data: {
					supportedEndpoints: this.SUPPORTED_ENDPOINTS,
				},
			});
		}

		const r2ObjectKey = `${this.KEY_PREFIX}${endpoint}`.replace('/', '_');

		// handle get endpoint no auth required
		if (endpoint === '/get') {
			try {
				const object = await this.env.AIBTCDEV_SERVICES_BUCKET.get(r2ObjectKey);

				if (!object) {
					return createApiResponse('Object not found', 404);
				}

				// Return the object with appropriate headers
				return new Response(object.body, {
					headers: {
						'content-type': object.httpMetadata?.contentType || 'application/octet-stream',
						etag: object.httpEtag,
						'cache-control': object.httpMetadata?.cacheControl || 'public, max-age=31536000',
					},
				});
			} catch (error) {
				return createApiResponse('Failed to retrieve object', 500);
			}
		}

		// all methods from this point forward require a shared key
		// frontend and backend each have their own stored in KV
		const authResult = await validateSharedKeyAuth(this.env, request);
		if (!authResult.success) {
			return createApiResponse(authResult.error, authResult.status);
		}

		if (endpoint === '/list') {
			try {
				const options: R2ListOptions = {
					limit: 1000, // Adjust as needed
					prefix: url.searchParams.get('prefix') || undefined,
					cursor: url.searchParams.get('cursor') || undefined,
				};

				const objects = await this.env.AIBTCDEV_SERVICES_BUCKET.list(options);
				return createApiResponse({
					message: 'Successfully listed objects',
					data: {
						objects: objects.objects.map((obj) => ({
							key: obj.key,
							size: obj.size,
							uploaded: obj.uploaded,
							etag: obj.etag,
							httpEtag: obj.httpEtag,
						})),
						truncated: objects.truncated,
						cursor: objects.truncated ? objects.cursor : undefined,
					},
				});
			} catch (error) {
				return createApiResponse('Failed to list objects', 500);
			}
		}

		// all methods from this point forward are POST
		if (request.method !== 'POST') {
			return createApiResponse(`Unsupported method: ${request.method}, supported method: POST`, 405);
		}

		if (endpoint === '/put') {
			try {
				const object = await this.env.AIBTCDEV_SERVICES_BUCKET.put(r2ObjectKey, request.body, {
					httpMetadata: {
						contentType: request.headers.get('content-type') || 'application/octet-stream',
					},
				});

				return createApiResponse({
					message: 'Successfully stored object',
					data: { r2ObjectKey, etag: object.httpEtag },
				});
			} catch (error) {
				return createApiResponse('Failed to store object', 500);
			}
		}

		if (endpoint === '/delete') {
			try {
				await this.env.AIBTCDEV_SERVICES_BUCKET.delete(r2ObjectKey);
				return createApiResponse({
					message: 'Successfully deleted object',
					data: { r2ObjectKey },
				});
			} catch (error) {
				return createApiResponse('Failed to delete object', 500);
			}
		}

		return createApiResponse(`Unsupported endpoint: ${endpoint}`, 404);
	}
}
