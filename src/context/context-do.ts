import { DurableObject } from 'cloudflare:workers';
import { Env } from '../../worker-configuration';
import { AppConfig } from '../config';
import { createApiResponse } from '../utils/requests-responses';

/**
 * Durable Object class for providing transformed data as API endpoints
 */
export class ContextDO extends DurableObject<Env> {
	private readonly ALARM_INTERVAL_MS: number;
	private readonly BASE_PATH: string = '/context';
	private readonly SUPPORTED_ENDPOINTS: string[] = ['/hello'];

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
			console.log(`ContextDO: alarm activated`);
		} catch (error) {
			console.error(`ContextDO: alarm execution failed: ${error instanceof Error ? error.message : String(error)}`);
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
			return createApiResponse(`Supported endpoints: ${this.SUPPORTED_ENDPOINTS.join(', ')}`);
		}

		if (endpoint === '/hello') {
			return createApiResponse('hello from context!');
		}

		return createApiResponse(`Unsupported endpoint: ${endpoint}, supported endpoints: ${this.SUPPORTED_ENDPOINTS.join(', ')}`, 404);
	}
}
