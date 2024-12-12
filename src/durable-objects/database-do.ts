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
	getUserRole,
	getUserProfile,
	createUserProfile,
	updateUserProfile,
	deleteUserProfile,
} from '../database/helpers';
import { validateSharedKeyAuth } from '../utils/auth-helper';

/**
 * Durable Object class for backend database calls
 */
export class DatabaseDO extends DurableObject<Env> {
	private readonly orm: D1Orm;
	private readonly ALARM_INTERVAL_MS: number;
	private readonly BASE_PATH = '/database';
	private readonly KEY_PREFIX = 'db';
	private readonly SUPPORTED_ENDPOINTS: string[] = [
		'/conversations',
		'/conversations/latest',
		'/conversations/history',
		'/crews/public',
		'/crews/get',
		'/crews/create',
		'/crews/update',
		'/crews/delete',
		'/crews/executions',
		'/crews/executions/add',
		'/crons/enabled',
		'/crons/enabled/detailed',
		'/profiles/role',
		'/profiles/get',
		'/profiles/create',
		'/profiles/update',
		'/profiles/delete',
		'/profiles/admin/list',
		'/profiles/admin/update',
		'/agents/get',
		'/agents/create', 
		'/agents/update',
		'/agents/delete',
		'/tasks/get',
		'/tasks/list',
		'/tasks/create',
		'/tasks/update',
		'/tasks/delete',
		'/tasks/delete-all'
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
		const authResult = await validateSharedKeyAuth(this.env, request);
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

			if (endpoint === '/crews/get') {
				const crewId = url.searchParams.get('id');
				if (!crewId) {
					return createJsonResponse({ error: 'Missing id parameter' }, 400);
				}
				const crew = await getCrew(this.orm, parseInt(crewId));
				return createJsonResponse({ crew });
			}

			if (endpoint === '/crews/create') {
				if (request.method !== 'POST') {
					return createJsonResponse({ error: 'Method not allowed' }, 405);
				}
				const crewData = await request.json();
				if (!crewData.profile_id || !crewData.crew_name) {
					return createJsonResponse({ error: 'Missing required fields: profile_id, crew_name' }, 400);
				}
				const crew = await createCrew(this.orm, crewData);
				return createJsonResponse({ crew });
			}

			if (endpoint === '/crews/update') {
				if (request.method !== 'PUT') {
					return createJsonResponse({ error: 'Method not allowed' }, 405);
				}
				const crewId = url.searchParams.get('id');
				if (!crewId) {
					return createJsonResponse({ error: 'Missing id parameter' }, 400);
				}
				const updates = await request.json();
				const result = await updateCrew(this.orm, parseInt(crewId), updates);
				return createJsonResponse({ result });
			}

			if (endpoint === '/crews/delete') {
				if (request.method !== 'DELETE') {
					return createJsonResponse({ error: 'Method not allowed' }, 405);
				}
				const crewId = url.searchParams.get('id');
				if (!crewId) {
					return createJsonResponse({ error: 'Missing id parameter' }, 400);
				}
				const result = await deleteCrew(this.orm, parseInt(crewId));
				return createJsonResponse({ result });
			}

			// Agent endpoints
			if (endpoint === '/agents/get') {
				const crewId = url.searchParams.get('crewId');
				if (!crewId) {
					return createJsonResponse({ error: 'Missing crewId parameter' }, 400);
				}
				const agents = await getAgents(this.orm, parseInt(crewId));
				return createJsonResponse({ agents });
			}

			if (endpoint === '/agents/create') {
				if (request.method !== 'POST') {
					return createJsonResponse({ error: 'Method not allowed' }, 405);
				}
				const agentData = await request.json();
				if (!agentData.profile_id || !agentData.crew_id || !agentData.agent_name || 
					!agentData.agent_role || !agentData.agent_goal || !agentData.agent_backstory) {
					return createJsonResponse({ error: 'Missing required fields' }, 400);
				}
				const agent = await createAgent(this.orm, agentData);
				return createJsonResponse({ agent });
			}

			if (endpoint === '/agents/update') {
				if (request.method !== 'PUT') {
					return createJsonResponse({ error: 'Method not allowed' }, 405);
				}
				const agentId = url.searchParams.get('id');
				if (!agentId) {
					return createJsonResponse({ error: 'Missing id parameter' }, 400);
				}
				const updates = await request.json();
				const result = await updateAgent(this.orm, parseInt(agentId), updates);
				return createJsonResponse({ result });
			}

			if (endpoint === '/agents/delete') {
				if (request.method !== 'DELETE') {
					return createJsonResponse({ error: 'Method not allowed' }, 405);
				}
				const agentId = url.searchParams.get('id');
				if (!agentId) {
					return createJsonResponse({ error: 'Missing id parameter' }, 400);
				}
				const result = await deleteAgent(this.orm, parseInt(agentId));
				return createJsonResponse({ result });
			}

			// Task endpoints
			if (endpoint === '/tasks/get') {
				const taskId = url.searchParams.get('id');
				if (!taskId) {
					return createJsonResponse({ error: 'Missing id parameter' }, 400);
				}
				const task = await getTask(this.orm, parseInt(taskId));
				return createJsonResponse({ task });
			}

			if (endpoint === '/tasks/list') {
				const agentId = url.searchParams.get('agentId');
				if (!agentId) {
					return createJsonResponse({ error: 'Missing agentId parameter' }, 400);
				}
				const tasks = await getTasks(this.orm, parseInt(agentId));
				return createJsonResponse({ tasks });
			}

			if (endpoint === '/tasks/create') {
				if (request.method !== 'POST') {
					return createJsonResponse({ error: 'Method not allowed' }, 405);
				}
				const taskData = await request.json();
				if (!taskData.profile_id || !taskData.crew_id || !taskData.agent_id || 
					!taskData.task_name || !taskData.task_description || !taskData.task_expected_output) {
					return createJsonResponse({ error: 'Missing required fields' }, 400);
				}
				const task = await createTask(this.orm, taskData);
				return createJsonResponse({ task });
			}

			if (endpoint === '/tasks/update') {
				if (request.method !== 'PUT') {
					return createJsonResponse({ error: 'Method not allowed' }, 405);
				}
				const taskId = url.searchParams.get('id');
				if (!taskId) {
					return createJsonResponse({ error: 'Missing id parameter' }, 400);
				}
				const updates = await request.json();
				const result = await updateTask(this.orm, parseInt(taskId), updates);
				return createJsonResponse({ result });
			}

			if (endpoint === '/tasks/delete') {
				if (request.method !== 'DELETE') {
					return createJsonResponse({ error: 'Method not allowed' }, 405);
				}
				const taskId = url.searchParams.get('id');
				if (!taskId) {
					return createJsonResponse({ error: 'Missing id parameter' }, 400);
				}
				const result = await deleteTask(this.orm, parseInt(taskId));
				return createJsonResponse({ result });
			}

			if (endpoint === '/tasks/delete-all') {
				if (request.method !== 'DELETE') {
					return createJsonResponse({ error: 'Method not allowed' }, 405);
				}
				const agentId = url.searchParams.get('agentId');
				if (!agentId) {
					return createJsonResponse({ error: 'Missing agentId parameter' }, 400);
				}
				const result = await deleteTasks(this.orm, parseInt(agentId));
				return createJsonResponse({ result });
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

			// Profile endpoints
			if (endpoint === '/profiles/role') {
				const address = url.searchParams.get('address');
				if (!address) {
					return createJsonResponse({ error: 'Missing address parameter' }, 400);
				}
				const role = await getUserRole(this.orm, address);
				return createJsonResponse({ role });
			}

			if (endpoint === '/profiles/get') {
				const address = url.searchParams.get('address');
				if (!address) {
					return createJsonResponse({ error: 'Missing address parameter' }, 400);
				}
				const profile = await getUserProfile(this.orm, address);
				return createJsonResponse({ profile });
			}

			if (endpoint === '/profiles/create') {
				if (request.method !== 'POST') {
					return createJsonResponse({ error: 'Method not allowed' }, 405);
				}
				const profileData = await request.json();
				if (!profileData.stx_address || !profileData.user_role) {
					return createJsonResponse({ error: 'Missing required fields: stx_address, user_role' }, 400);
				}
				const profile = await createUserProfile(this.orm, profileData);
				return createJsonResponse({ profile });
			}

			if (endpoint === '/profiles/update') {
				if (request.method !== 'PUT') {
					return createJsonResponse({ error: 'Method not allowed' }, 405);
				}
				const address = url.searchParams.get('address');
				if (!address) {
					return createJsonResponse({ error: 'Missing address parameter' }, 400);
				}
				const profileData = await request.json();
				const result = await updateUserProfile(this.orm, address, profileData);
				return createJsonResponse({ result });
			}

			if (endpoint === '/profiles/delete') {
				if (request.method !== 'DELETE') {
					return createJsonResponse({ error: 'Method not allowed' }, 405);
				}
				const address = url.searchParams.get('address');
				if (!address) {
					return createJsonResponse({ error: 'Missing address parameter' }, 400);
				}
				const result = await deleteUserProfile(this.orm, address);
				return createJsonResponse({ result });
			}

			// Admin profile endpoints
			if (endpoint === '/profiles/admin/list') {
				const profiles = await getAllUserProfiles(this.orm);
				return createJsonResponse({ profiles });
			}

			if (endpoint === '/profiles/admin/update') {
				if (request.method !== 'PUT') {
					return createJsonResponse({ error: 'Method not allowed' }, 405);
				}
				const userId = url.searchParams.get('userId');
				if (!userId) {
					return createJsonResponse({ error: 'Missing userId parameter' }, 400);
				}
				const updates = await request.json();
				const result = await updateUserProfileById(this.orm, parseInt(userId), updates);
				return createJsonResponse({ result });
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
