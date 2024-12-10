import { DurableObject } from 'cloudflare:workers';
import { Env } from '../../worker-configuration';
import { AppConfig } from '../config';
import { createJsonResponse } from '../utils/requests-responses';
import { D1Orm } from 'd1-orm';
import {
	addCrewExecution,
	getConversationHistory,
	getConversations,
	getCrewExecutions,
	getEnabledCrons,
	getEnabledCronsDetailed,
	getLatestConversation,
	getPublicCrews,
} from '../database/database-helpers';

/**
 * Durable Object class for backend database calls
 */
export class DatabaseDO extends DurableObject<Env> {
	private readonly orm: D1Orm;
	private readonly ALARM_INTERVAL_MS: number;
	private readonly BASE_PATH = '/database';
	private readonly KEY_PREFIX = 'db';
	private readonly SUPPORTED_ENDPOINTS: string[] = [
		'/hello',
		'/conversations',
		'/conversations/latest',
		'/conversations/history',
		'/crews/public',
		'/crews/executions',
		'/crews/executions/add',
		'/crons/enabled',
		'/crons/enabled/detailed',
	];

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

		if (endpoint === '/hello') {
			return createJsonResponse({
				message: 'hello from database!',
			});
		}

		// all methods from this point forward require a shared key
		// frontend and backend each have their own stored in KV
		const authResult = await this.validateAuth(request);
		if (!authResult.success) {
			return createJsonResponse({ error: authResult.error }, authResult.status);
		}

		try {
			// Conversation endpoints
			if (endpoint === '/conversations') {
				const address = url.searchParams.get('address');
				if (!address) {
					return createJsonResponse({ error: 'Missing address parameter' }, 400);
				}
				const conversations = await getConversations(this.orm, address);
				return createJsonResponse({ conversations });
			}

			if (endpoint === '/conversations/latest') {
				const address = url.searchParams.get('address');
				if (!address) {
					return createJsonResponse({ error: 'Missing address parameter' }, 400);
				}
				const conversation = await getLatestConversation(this.orm, address);
				return createJsonResponse({ conversation });
			}

			if (endpoint === '/conversations/history') {
				const conversationId = url.searchParams.get('id');
				if (!conversationId) {
					return createJsonResponse({ error: 'Missing id parameter' }, 400);
				}
				const history = await getConversationHistory(this.orm, parseInt(conversationId));
				return createJsonResponse({ history });
			}

			// Crew endpoints
			if (endpoint === '/crews/public') {
				const crews = await getPublicCrews(this.orm);
				return createJsonResponse({ crews });
			}

			if (endpoint === '/crews/executions') {
				const address = url.searchParams.get('address');
				if (!address) {
					return createJsonResponse({ error: 'Missing address parameter' }, 400);
				}
				const executions = await getCrewExecutions(this.orm, address);
				return createJsonResponse({ executions });
			}

			if (endpoint === '/crews/executions/add') {
				if (request.method !== 'POST') {
					return createJsonResponse({ error: 'Method not allowed' }, 405);
				}

				type AddCrewExecutionRequest = {
					address: string;
					crewId: number;
					conversationId: number;
					input: string;
				};

				const body: AddCrewExecutionRequest = await request.json();
				const { address, crewId, conversationId, input } = body;

				if (!address || !crewId || !conversationId || !input) {
					return createJsonResponse(
						{
							error: 'Missing required parameters: address, crewId, conversationId, input',
						},
						400
					);
				}

				const execution = await addCrewExecution(this.orm, address, crewId, conversationId, input);
				return createJsonResponse({ execution });
			}

			// Cron endpoints
			if (endpoint === '/crons/enabled') {
				const crons = await getEnabledCrons(this.orm);
				return createJsonResponse({ crons });
			}

			if (endpoint === '/crons/enabled/detailed') {
				const crons = await getEnabledCronsDetailed(this.orm);
				return createJsonResponse({ crons });
			}
		} catch (error) {
			console.error(`Database error: ${error instanceof Error ? error.message : String(error)}`);
			return createJsonResponse({ error: 'Internal server error' }, 500);
		}

		return createJsonResponse(
			{
				error: `Unsupported endpoint: ${endpoint}, supported endpoints: ${this.SUPPORTED_ENDPOINTS.join(', ')}`,
			},
			404
		);
	}
}
