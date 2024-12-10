import { DurableObject } from 'cloudflare:workers';
import { Env } from '../../worker-configuration';
import { AppConfig } from '../config';
import { createJsonResponse } from '../utils/requests-responses';
import { D1Orm } from 'd1-orm';

/**
 * Durable Object class for backend database calls
 */
export class DatabaseDO extends DurableObject<Env> {
	private readonly orm: D1Orm;
	private readonly ALARM_INTERVAL_MS: number;
	private readonly BASE_PATH = '/database';
	private readonly KEY_PREFIX = 'db';
	private readonly SUPPORTED_ENDPOINTS: string[] = ['/hello'];

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.ctx = ctx;
		this.env = env;
		// initialize d1-orm with cloudflare d1 database
		this.orm = new D1Orm(env.AIBTCDEV_SERVICES_DB);

		// Initialize AppConfig with environment
		const config = AppConfig.getInstance(env).getConfig();
		this.ALARM_INTERVAL_MS = config.ALARM_INTERVAL_MS;

		// Set up alarm to run at configured interval
		ctx.storage.setAlarm(Date.now() + this.ALARM_INTERVAL_MS);
	}

	async alarm(): Promise<void> {
		try {
			console.log(`DatabaseDO: alarm activated`);
		} catch (error) {
			console.error(`DatabaseDO: alarm execution failed: ${error instanceof Error ? error.message : String(error)}`);
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

		if (endpoint === '/hello') {
			return createJsonResponse({
				message: 'hello from database!',
			});
		}

		// all methods from this point forward require a shared key
		// frontend and backend each have their own stored in KV
		// and implemented as env vars in each project
		// TODO: consolidate into a helper fn
		if (!request.headers.has('Authorization')) {
			return createJsonResponse(
				{
					error: 'Missing Authorization header',
				},
				401
			);
		}
		const frontendKey = await this.env.AIBTCDEV_SERVICES_KV.get('key:aibtcdev-frontend');
		const backendKey = await this.env.AIBTCDEV_SERVICES_KV.get('key:aibtcdev-backend');
		if (frontendKey === null || backendKey == null) {
			return createJsonResponse(
				{
					error: 'Unable to load shared keys for frontend/backend',
				},
				401
			);
		}
		const validKeys = [frontendKey, backendKey];
		const requestKey = request.headers.get('Authorization');
		if (requestKey === null || !validKeys.includes(requestKey)) {
			return createJsonResponse(
				{
					error: 'Invalid Authorization key',
				},
				401
			);
		}

		return createJsonResponse(
			{
				error: `Unsupported endpoint: ${endpoint}, supported endpoints: ${this.SUPPORTED_ENDPOINTS.join(', ')}`,
			},
			404
		);
	}
}
