import { DurableObject } from 'cloudflare:workers';
import { Env } from '../../worker-configuration';
import { AppConfig } from '../config';
import { createJsonResponse } from '../utils/requests-responses';
import { D1Orm } from 'd1-orm';
import { UserAgentsTable, UserCrewsTable, UserCronsTable, UserProfilesTable, UserTasksTable } from '../database/models';
import { getAgents, createAgent, updateAgent, deleteAgent } from '../database/helpers/agents';
import {
    getAuthor,
    addAuthor,
    getTweet,
    getThreadTweets,
    getAuthorTweets,
    addTweet,
    getTweetLogs,
    addLog,
} from '../database/helpers/twitter';
import {
	createCrew,
	getCrew,
	updateCrew,
	deleteCrew,
	getPublicCrews,
	getCrewExecutions,
	addCrewExecution,
	getCrewsByProfile,
} from '../database/helpers/crews';
import {
	getCronsByCrew,
	createCron,
	updateCronInput,
	toggleCronStatus,
	getEnabledCrons,
	getEnabledCronsDetailed,
} from '../database/helpers/crons';
import {
	getUserRole,
	getUserProfile,
	createUserProfile,
	updateUserProfile,
	deleteUserProfile,
	getAllUserProfiles,
	updateUserProfileById,
} from '../database/helpers/profiles';
import { getConversationHistory, getConversations, getLatestConversation } from '../database/helpers/conversations';
import { getTask, getTasks, createTask, updateTask, deleteTask, deleteTasks } from '../database/helpers/tasks';
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
		'/conversations/create',
		'/crews/profile',
		'/crews/public',
		'/crews/get',
		'/crews/create',
		'/crews/update',
		'/crews/delete',
		'/crews/executions',
		'/crews/executions/add',
		'/crons/enabled',
		'/crons/enabled/detailed',
		'/crons/get',
		'/crons/create',
		'/crons/update',
		'/crons/toggle',
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
		'/tasks/delete-all',
		'/twitter/authors/get',
		'/twitter/authors/create',
		'/twitter/authors/update', 
		'/twitter/tweets/get',
		'/twitter/tweets/thread',
		'/twitter/tweets/author',
		'/twitter/tweets/add',
		'/twitter/logs/get',
		'/twitter/logs/add',
		'/crews/steps/get',
		'/crews/steps/create',
		'/crews/steps/delete',
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
			if (endpoint === '/crews/profile') {
				const address = url.searchParams.get('address');
				if (!address) {
					return createJsonResponse({ error: 'Missing address parameter' }, 400);
				}

				// Get the session token from Authorization header
				const authHeader = request.headers.get('Authorization');
				if (!authHeader) {
					return createJsonResponse({ error: 'Missing authorization header' }, 401);
				}

				// Extract token from Bearer format
				const token = authHeader.replace('Bearer ', '');
				
				// Verify the token matches the requested address
				const tokenAddress = await validateSessionToken(this.env, token);
				if (!tokenAddress || tokenAddress !== address) {
					return createJsonResponse({ error: 'Unauthorized access' }, 403);
				}

				const crews = await getCrewsByProfile(this.orm, address);
				return createJsonResponse({ crews });
			}

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
				const crewData = (await request.json()) as Omit<UserCrewsTable, 'id' | 'created_at' | 'updated_at'>;
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
				const updates = (await request.json()) as Partial<Omit<UserCrewsTable, 'id' | 'created_at' | 'updated_at' | 'profile_id'>>;
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
				const agentData = (await request.json()) as Omit<UserAgentsTable, 'id' | 'created_at' | 'updated_at'>;
				if (
					!agentData.profile_id ||
					!agentData.crew_id ||
					!agentData.agent_name ||
					!agentData.agent_role ||
					!agentData.agent_goal ||
					!agentData.agent_backstory
				) {
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
				const updates = (await request.json()) as Partial<
					Omit<UserAgentsTable, 'id' | 'created_at' | 'updated_at' | 'profile_id' | 'crew_id'>
				>;
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
				const taskData = (await request.json()) as UserTasksTable;
				if (
					!taskData.profile_id ||
					!taskData.crew_id ||
					!taskData.agent_id ||
					!taskData.task_name ||
					!taskData.task_description ||
					!taskData.task_expected_output
				) {
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
				const updates = (await request.json()) as Partial<
					Omit<UserTasksTable, 'id' | 'created_at' | 'updated_at' | 'profile_id' | 'crew_id' | 'agent_id'>
				>;
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

			// Cron management endpoints
			if (endpoint === '/crons/get') {
				const crewId = url.searchParams.get('crewId');
				if (!crewId) {
					return createJsonResponse({ error: 'Missing crewId parameter' }, 400);
				}
				const crons = await getCronsByCrew(this.orm, parseInt(crewId));
				return createJsonResponse({ crons });
			}

			if (endpoint === '/crons/create') {
				if (request.method !== 'POST') {
					return createJsonResponse({ error: 'Method not allowed' }, 405);
				}
				const cronData = (await request.json()) as UserCronsTable;
				if (!cronData.profile_id || !cronData.crew_id || cronData.cron_enabled === undefined) {
					return createJsonResponse({ error: 'Missing required fields' }, 400);
				}
				// Set defaults if not provided
				cronData.cron_interval = cronData.cron_interval || '0 * * * *'; // Default to hourly
				cronData.cron_input = cronData.cron_input || '';
				const cron = await createCron(this.orm, cronData);
				return createJsonResponse({ cron });
			}

			if (endpoint === '/crons/update') {
				if (request.method !== 'PUT') {
					return createJsonResponse({ error: 'Method not allowed' }, 405);
				}
				const cronId = url.searchParams.get('id');
				if (!cronId) {
					return createJsonResponse({ error: 'Missing id parameter' }, 400);
				}
				const { cron_input } = (await request.json()) as UserCronsTable;
				if (cron_input === undefined) {
					return createJsonResponse({ error: 'Missing cron_input in request body' }, 400);
				}
				const result = await updateCronInput(this.orm, parseInt(cronId), cron_input);
				return createJsonResponse({ result });
			}

			if (endpoint === '/crons/toggle') {
				if (request.method !== 'PUT') {
					return createJsonResponse({ error: 'Method not allowed' }, 405);
				}
				const cronId = url.searchParams.get('id');
				if (!cronId) {
					return createJsonResponse({ error: 'Missing id parameter' }, 400);
				}
				const { cron_enabled } = (await request.json()) as UserCronsTable;
				if (cron_enabled === undefined) {
					return createJsonResponse({ error: 'Missing enabled in request body' }, 400);
				}
				const result = await toggleCronStatus(this.orm, parseInt(cronId), cron_enabled ? 1 : 0);
				return createJsonResponse({ result });
			}

			// Conversation creation endpoint
			if (endpoint === '/conversations/create') {
				if (request.method !== 'POST') {
					return createJsonResponse({ error: 'Method not allowed' }, 405);
				}
				
				const { address, name } = await request.json();
				if (!address) {
					return createJsonResponse({ error: 'Missing required field: address' }, 400);
				}
				
				const result = await addConversation(this.orm, address, name);
				return createJsonResponse({ result });
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
				const profileData = (await request.json()) as UserProfilesTable;
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
				const profileData = (await request.json()) as UserProfilesTable;
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
				const updates = (await request.json()) as UserProfilesTable;
				const result = await updateUserProfileById(this.orm, parseInt(userId), updates);
				return createJsonResponse({ result });
			}
		} catch (error) {
			console.error(`Database error: ${error instanceof Error ? error.message : String(error)}`);
			return createJsonResponse({ error: `Database error: ${error instanceof Error ? error.message : String(error)}` }, 500);
		}

		// Twitter/X Bot endpoints
		if (endpoint === '/twitter/authors/get') {
			const authorId = url.searchParams.get('authorId');
			if (!authorId) {
				return createJsonResponse({ error: 'Missing authorId parameter' }, 400);
			}
			const author = await getAuthor(this.orm, authorId);
			return createJsonResponse({ author });
		}

		if (endpoint === '/twitter/authors/create') {
			if (request.method !== 'POST') {
				return createJsonResponse({ error: 'Method not allowed' }, 405);
			}
			const { authorId, realname, username } = await request.json();
			if (!authorId) {
				return createJsonResponse({ error: 'Missing required fields: authorId' }, 400);
			}
			const author = await addAuthor(this.orm, authorId, realname, username);
			return createJsonResponse({ author });
		}

		if (endpoint === '/twitter/tweets/get') {
			const tweetId = url.searchParams.get('tweetId');
			if (!tweetId) {
				return createJsonResponse({ error: 'Missing tweetId parameter' }, 400);
			}
			const tweet = await getTweet(this.orm, tweetId);
			return createJsonResponse({ tweet });
		}

		if (endpoint === '/twitter/tweets/thread') {
			const threadId = url.searchParams.get('threadId');
			if (!threadId) {
				return createJsonResponse({ error: 'Missing threadId parameter' }, 400);
			}
			const tweets = await getThreadTweets(this.orm, parseInt(threadId));
			return createJsonResponse({ tweets });
		}

		if (endpoint === '/twitter/tweets/author') {
			const authorId = url.searchParams.get('authorId');
			if (!authorId) {
				return createJsonResponse({ error: 'Missing authorId parameter' }, 400);
			}
			const tweets = await getAuthorTweets(this.orm, authorId);
			return createJsonResponse({ tweets });
		}

		if (endpoint === '/twitter/tweets/add') {
			if (request.method !== 'POST') {
				return createJsonResponse({ error: 'Method not allowed' }, 405);
			}
			const { authorId, tweetId, tweetBody, threadId, parentTweetId, isBotResponse } = await request.json();
			if (!authorId || !tweetId || !tweetBody) {
				return createJsonResponse({ error: 'Missing required fields: authorId, tweetId, tweetBody' }, 400);
			}
			const tweet = await addTweet(
				this.orm,
				authorId,
				tweetId,
				tweetBody,
				threadId,
				parentTweetId,
				isBotResponse
			);
			return createJsonResponse({ tweet });
		}

		if (endpoint === '/twitter/logs/get') {
			const tweetId = url.searchParams.get('tweetId');
			if (!tweetId) {
				return createJsonResponse({ error: 'Missing tweetId parameter' }, 400);
			}
			const logs = await getTweetLogs(this.orm, tweetId);
			return createJsonResponse({ logs });
		}

		if (endpoint === '/twitter/logs/add') {
			if (request.method !== 'POST') {
				return createJsonResponse({ error: 'Method not allowed' }, 405);
			}
			const { tweetId, status, message } = await request.json();
			if (!tweetId || !status) {
				return createJsonResponse({ error: 'Missing required fields: tweetId, status' }, 400);
			}
			const log = await addLog(this.orm, tweetId, status, message);
			return createJsonResponse({ log });
		}

		return createJsonResponse(
			{
				error: `Unsupported endpoint: ${endpoint}, supported endpoints: ${this.SUPPORTED_ENDPOINTS.join(', ')}`,
			},
			404
		);
	}
}
