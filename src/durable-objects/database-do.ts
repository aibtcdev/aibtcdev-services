import { DurableObject } from 'cloudflare:workers';
import { Env } from '../../worker-configuration';
import { AppConfig } from '../config';
import { createJsonResponse } from '../utils/requests-responses';

/**
 * Durable Object class for backend database calls
 */
export class DatabaseDO extends DurableObject<Env> {
	private readonly CACHE_TTL: number;
	private readonly ALARM_INTERVAL_MS: number;
	private readonly BASE_PATH: string = '/db';
	private readonly CACHE_PREFIX: string = this.BASE_PATH.replaceAll('/', '');
	private readonly SUPPORTED_ENDPOINTS: string[] = [];

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.ctx = ctx;
		this.env = env;

		// Initialize AppConfig with environment
		const config = AppConfig.getInstance(env).getConfig();
		this.CACHE_TTL = config.CACHE_TTL;
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

		return createJsonResponse(
			{
				error: `Unsupported endpoint: ${endpoint}, supported endpoints: ${this.SUPPORTED_ENDPOINTS.join(', ')}`,
			},
			404
		);
	}
}
