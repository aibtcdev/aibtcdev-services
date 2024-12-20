import { DurableObject } from 'cloudflare:workers';
import { Env } from '../../worker-configuration';
import { AppConfig } from '../config';
import { createApiResponse } from '../utils/requests-responses';
import { D1Orm } from 'd1-orm';
import {
	UserAgentsTable,
	UserConversationsTable,
	UserCrewExecutionsTable,
	UserCrewExecutionStepsTable,
	UserCrewsTable,
	UserCronsTable,
	UserProfilesTable,
	UserTasksTable,
	XBotAuthorsTable,
	XBotLogsTable,
	XBotTweetsTable,
} from './models';
import { getAgents, createAgent, updateAgent, deleteAgent } from './helpers/agents';
import { getAuthor, addAuthor, getTweet, getThreadTweets, getAuthorTweets, addTweet, getTweetLogs, addLog } from './helpers/twitter';
import {
	createCrew,
	getCrew,
	updateCrew,
	deleteCrew,
	getPublicCrews,
	getCrewExecutions,
	addCrewExecution,
	getCrewsByProfile,
	getExecutionSteps,
	createExecutionStep,
	deleteExecutionSteps,
} from './helpers/crews';
import { getCronsByCrew, createCron, updateCronInput, toggleCronStatus, getEnabledCrons, getEnabledCronsDetailed } from './helpers/crons';
import {
	getUserRole,
	getUserProfile,
	createUserProfile,
	updateUserProfile,
	deleteUserProfile,
	getAllUserProfiles,
	updateUserProfileById,
} from './helpers/profiles';
import { addConversation, getConversationHistory, getConversations, getLatestConversation } from './helpers/conversations';
import { getTask, getTasks, createTask, updateTask, deleteTask, deleteTasks } from './helpers/tasks';
import { validateSessionToken, validateSharedKeyAuth } from '../utils/auth-helper';

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
			return createApiResponse(`Request at ${path} does not start with base path ${this.BASE_PATH}`, 404);
		}

		// Remove base path to get the endpoint
		const endpoint = path.replace(this.BASE_PATH, '');

		// Handle root path
		if (endpoint === '' || endpoint === '/') {
			return createApiResponse({
				message: 'Database service endpoints available',
				data: {
					endpoints: this.SUPPORTED_ENDPOINTS
				}
			});
		}

		// all methods from this point forward require a shared key
		// frontend and backend each have their own stored in KV
		const authResult = await validateSharedKeyAuth(this.env, request);
		if (!authResult.success) {
			return createApiResponse(authResult.error, authResult.status);
		}

		try {
			// Conversation endpoints
			if (endpoint === '/conversations') {
				const address = url.searchParams.get('address');
				if (!address) {
					return createApiResponse('Missing address parameter', 400);
				}
				const conversations = await getConversations(this.orm, address);
				return createApiResponse({
					message: 'Successfully retrieved conversations',
					data: conversations
				});
			}

			if (endpoint === '/conversations/latest') {
				const address = url.searchParams.get('address');
				if (!address) {
					return createApiResponse('Missing address parameter', 400);
				}
				const conversation = await getLatestConversation(this.orm, address);
				return createApiResponse({
					message: 'Successfully retrieved latest conversation',
					data: conversation
				});
			}

			if (endpoint === '/conversations/history') {
				const conversationId = url.searchParams.get('id');
				if (!conversationId) {
					return createApiResponse('Missing conversation ID parameter', 400);
				}
				const history = await getConversationHistory(this.orm, parseInt(conversationId));
				return createApiResponse({
					message: 'Successfully retrieved conversation history',
					data: history
				});
			}

			// Crew endpoints
			if (endpoint === '/crews/profile') {
				const address = url.searchParams.get('address');
				if (!address) {
					return createJsonResponse('Missing address parameter', 400);
				}

				// Get the session token from Authorization header
				const authHeader = request.headers.get('Authorization');
				if (!authHeader) {
					return createApiResponse('Missing authorization header', 401);
				}

				// Extract token from Bearer format
				const token = authHeader.replace('Bearer ', '');

				// Verify the token matches the requested address
				const tokenAddress = await validateSessionToken(this.env, token);
				if (!tokenAddress.success || tokenAddress.address !== address) {
					return createApiResponse('Unauthorized access', 403);
				}

				const crews = await getCrewsByProfile(this.orm, address);
				return createApiResponse({
					message: 'Successfully retrieved profile crews',
					data: crews
				});
			}

			if (endpoint === '/crews/public') {
				const crews = await getPublicCrews(this.orm);
				return createJsonResponse({
					message: 'Successfully retrieved public crews',
					data: crews
				});
			}

			if (endpoint === '/crews/get') {
				const crewId = url.searchParams.get('id');
				if (!crewId) {
					return createJsonResponse('Missing id parameter', 400);
				}
				const crew = await getCrew(this.orm, parseInt(crewId));
				return createJsonResponse({
					message: 'Successfully retrieved crew',
					data: crew
				});
			}

			if (endpoint === '/crews/create') {
				if (request.method !== 'POST') {
					return createJsonResponse('Method not allowed', 405);
				}
				const crewData = (await request.json()) as Omit<UserCrewsTable, 'id' | 'created_at' | 'updated_at'>;
				if (!crewData.profile_id || !crewData.crew_name) {
					return createJsonResponse('Missing required fields: profile_id, crew_name', 400);
				}
				const crew = await createCrew(this.orm, crewData);
				return createJsonResponse({
					message: 'Successfully created crew',
					data: crew
				});
			}

			if (endpoint === '/crews/update') {
				if (request.method !== 'PUT') {
					return createJsonResponse('Method not allowed', 405);
				}
				const crewId = url.searchParams.get('id');
				if (!crewId) {
					return createJsonResponse('Missing id parameter', 400);
				}
				const updates = (await request.json()) as Partial<Omit<UserCrewsTable, 'id' | 'created_at' | 'updated_at' | 'profile_id'>>;
				const result = await updateCrew(this.orm, parseInt(crewId), updates);
				return createJsonResponse({
					message: 'Successfully updated crew',
					data: result
				});
			}

			if (endpoint === '/crews/delete') {
				if (request.method !== 'DELETE') {
					return createJsonResponse('Method not allowed', 405);
				}
				const crewId = url.searchParams.get('id');
				if (!crewId) {
					return createJsonResponse('Missing id parameter', 400);
				}
				const result = await deleteCrew(this.orm, parseInt(crewId));
				return createJsonResponse({
					message: 'Successfully deleted crew',
					data: result
				});
			}

			// Agent endpoints
			if (endpoint === '/agents/get') {
				const crewId = url.searchParams.get('crewId');
				if (!crewId) {
					return createJsonResponse('Missing crewId parameter', 400);
				}
				const agents = await getAgents(this.orm, parseInt(crewId));
				return createJsonResponse({
					message: 'Successfully retrieved agents',
					data: agents
				});
			}

			if (endpoint === '/agents/create') {
				if (request.method !== 'POST') {
					return createJsonResponse('Method not allowed', 405);
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
					return createJsonResponse('Missing required fields: profile_id, crew_id, agent_name, agent_role, agent_goal, agent_backstory', 400);
				}
				const agent = await createAgent(this.orm, agentData);
				return createJsonResponse({
					message: 'Successfully created agent',
					data: agent
				});
			}

			if (endpoint === '/agents/update') {
				if (request.method !== 'PUT') {
					return createJsonResponse('Method not allowed', 405);
				}
				const agentId = url.searchParams.get('id');
				if (!agentId) {
					return createJsonResponse('Missing id parameter', 400);
				}
				const updates = (await request.json()) as Partial<
					Omit<UserAgentsTable, 'id' | 'created_at' | 'updated_at' | 'profile_id' | 'crew_id'>
				>;
				const result = await updateAgent(this.orm, parseInt(agentId), updates);
				return createJsonResponse({
					message: 'Successfully updated agent',
					data: result
				});
			}

			if (endpoint === '/agents/delete') {
				if (request.method !== 'DELETE') {
					return createJsonResponse('Method not allowed', 405);
				}
				const agentId = url.searchParams.get('id');
				if (!agentId) {
					return createJsonResponse('Missing id parameter', 400);
				}
				const result = await deleteAgent(this.orm, parseInt(agentId));
				return createJsonResponse({
					message: 'Successfully deleted agent',
					data: result
				});
			}

			// Task endpoints
			if (endpoint === '/tasks/get') {
				const taskId = url.searchParams.get('id');
				if (!taskId) {
					return createJsonResponse('Missing id parameter', 400);
				}
				const task = await getTask(this.orm, parseInt(taskId));
				return createJsonResponse({
					message: 'Successfully retrieved task',
					data: task
				});
			}

			if (endpoint === '/tasks/list') {
				const agentId = url.searchParams.get('agentId');
				if (!agentId) {
					return createJsonResponse('Missing agentId parameter', 400);
				}
				const tasks = await getTasks(this.orm, parseInt(agentId));
				return createJsonResponse({
					message: 'Successfully retrieved tasks',
					data: tasks
				});
			}

			if (endpoint === '/tasks/create') {
				if (request.method !== 'POST') {
					return createJsonResponse('Method not allowed', 405);
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
					return createJsonResponse('Missing required fields: profile_id, crew_id, agent_id, task_name, task_description, task_expected_output', 400);
				}
				const task = await createTask(this.orm, taskData);
				return createJsonResponse({
					message: 'Successfully created task',
					data: task
				});
			}

			if (endpoint === '/tasks/update') {
				if (request.method !== 'PUT') {
					return createJsonResponse('Method not allowed', 405);
				}
				const taskId = url.searchParams.get('id');
				if (!taskId) {
					return createJsonResponse('Missing id parameter', 400);
				}
				const updates = (await request.json()) as Partial<
					Omit<UserTasksTable, 'id' | 'created_at' | 'updated_at' | 'profile_id' | 'crew_id' | 'agent_id'>
				>;
				const result = await updateTask(this.orm, parseInt(taskId), updates);
				return createJsonResponse({
					message: 'Successfully updated task',
					data: result
				});
			}

			if (endpoint === '/tasks/delete') {
				if (request.method !== 'DELETE') {
					return createJsonResponse('Method not allowed', 405);
				}
				const taskId = url.searchParams.get('id');
				if (!taskId) {
					return createJsonResponse('Missing id parameter', 400);
				}
				const result = await deleteTask(this.orm, parseInt(taskId));
				return createJsonResponse({
					message: 'Successfully deleted task',
					data: result
				});
			}

			if (endpoint === '/tasks/delete-all') {
				if (request.method !== 'DELETE') {
					return createJsonResponse('Method not allowed', 405);
				}
				const agentId = url.searchParams.get('agentId');
				if (!agentId) {
					return createJsonResponse('Missing agentId parameter', 400);
				}
				const result = await deleteTasks(this.orm, parseInt(agentId));
				return createJsonResponse({
					message: 'Successfully deleted all tasks for agent',
					data: result
				});
			}

			if (endpoint === '/crews/executions') {
				const address = url.searchParams.get('address');
				if (!address) {
					return createJsonResponse('Missing address parameter', 400);
				}
				const executions = await getCrewExecutions(this.orm, address);
				return createJsonResponse({
					message: 'Successfully retrieved crew executions',
					data: executions
				});
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
					return createApiResponse('Missing required parameters: address, crewId, conversationId, input', 400);
				}

				const execution = await addCrewExecution(this.orm, address, crewId, conversationId, input);
				return createApiResponse({
					message: 'Successfully created crew execution',
					data: { execution }
				});
			}

			// Cron endpoints
			if (endpoint === '/crons/enabled') {
				const crons = await getEnabledCrons(this.orm);
				return createApiResponse({
					message: 'Successfully retrieved enabled crons',
					data: { crons }
				});
			}

			if (endpoint === '/crons/enabled/detailed') {
				const crons = await getEnabledCronsDetailed(this.orm);
				return createApiResponse({
					message: 'Successfully retrieved detailed cron information',
					data: { crons }
				});
			}

			// Cron management endpoints
			if (endpoint === '/crons/get') {
				const crewId = url.searchParams.get('crewId');
				if (!crewId) {
					return createApiResponse('Missing crewId parameter', 400);
				}
				const crons = await getCronsByCrew(this.orm, parseInt(crewId));
				return createApiResponse({
					message: 'Successfully retrieved crons for crew',
					data: { crons }
				});
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
				return createApiResponse({
					message: 'Successfully updated user profile',
					data: { result }
				});
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

				const { profile_id, conversation_name } = (await request.json()) as UserConversationsTable;
				if (!profile_id) {
					return createJsonResponse({ error: 'Missing required field: address' }, 400);
				}

				const result = await addConversation(this.orm, profile_id, conversation_name ? conversation_name : 'new conversation');
				return createJsonResponse({ result });
			}

			// Profile endpoints
			if (endpoint === '/profiles/role') {
				const address = url.searchParams.get('address');
				if (!address) {
					return createApiResponse('Missing address parameter', 400);
				}
				const role = await getUserRole(this.orm, address);
				return createApiResponse({
					message: 'Successfully retrieved user role',
					data: { role }
				});
			}

			if (endpoint === '/profiles/get') {
				const address = url.searchParams.get('address');
				if (!address) {
					return createJsonResponse({ error: 'Missing address parameter' }, 400);
				}
				const profile = await getUserProfile(this.orm, address);
				return createApiResponse({
					message: 'Successfully retrieved user profile',
					data: { profile }
				});
			}

			if (endpoint === '/profiles/create') {
				if (request.method !== 'POST') {
					return createJsonResponse({ error: 'Method not allowed' }, 405);
				}
				const profileData = (await request.json()) as UserProfilesTable;
				if (!profileData.stx_address || !profileData.user_role) {
					return createApiResponse('Missing required fields: stx_address, user_role', 400);
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
				return createApiResponse({
					message: 'Successfully retrieved all user profiles',
					data: { profiles }
				});
			}

			if (endpoint === '/profiles/admin/update') {
				if (request.method !== 'PUT') {
					return createJsonResponse({ error: 'Method not allowed' }, 405);
				}
				const userId = url.searchParams.get('userId');
				if (!userId) {
					return createApiResponse('Missing userId parameter', 400);
				}
				const updates = (await request.json()) as UserProfilesTable;
				const result = await updateUserProfileById(this.orm, parseInt(userId), updates);
				return createJsonResponse({ result });
			}
		} catch (error) {
			console.error(`Database error: ${error instanceof Error ? error.message : String(error)}`);
			return createApiResponse(`Database error: ${error instanceof Error ? error.message : String(error)}`, 500);
		}

		// Twitter/X Bot endpoints
		if (endpoint === '/twitter/authors/get') {
			const authorId = url.searchParams.get('authorId');
			if (!authorId) {
				return createApiResponse('Missing authorId parameter', 400);
			}
			const author = await getAuthor(this.orm, authorId);
			return createApiResponse({
				message: 'Successfully retrieved author',
				data: { author }
			});
		}

		if (endpoint === '/twitter/authors/create') {
			if (request.method !== 'POST') {
				return createApiResponse('Method not allowed', 405);
			}
			const { author_id, realname, username } = (await request.json()) as XBotAuthorsTable;
			if (!author_id) {
				return createApiResponse('Missing required fields: authorId', 400);
			}
			const author = await addAuthor(this.orm, author_id, realname || undefined, username || undefined);
			return createApiResponse({
				message: 'Successfully created author',
				data: { author }
			});
		}

		if (endpoint === '/twitter/tweets/get') {
			const tweetId = url.searchParams.get('tweetId');
			if (!tweetId) {
				return createApiResponse('Missing tweetId parameter', 400);
			}
			const tweet = await getTweet(this.orm, tweetId);
			return createApiResponse({
				message: 'Successfully retrieved tweet',
				data: { tweet }
			});
		}

		if (endpoint === '/twitter/tweets/thread') {
			const threadId = url.searchParams.get('threadId');
			if (!threadId) {
				return createJsonResponse('Missing threadId parameter', 400);
			}
			const tweets = await getThreadTweets(this.orm, parseInt(threadId));
			return createApiResponse({
				message: 'Successfully retrieved thread tweets',
				data: { tweets }
			});
		}

		if (endpoint === '/twitter/tweets/author') {
			const authorId = url.searchParams.get('authorId');
			if (!authorId) {
				return createJsonResponse('Missing authorId parameter', 400);
			}
			const tweets = await getAuthorTweets(this.orm, authorId);
			return createJsonResponse({
				message: 'Successfully retrieved author tweets',
				data: tweets
			});
		}

		if (endpoint === '/twitter/tweets/add') {
			if (request.method !== 'POST') {
				return createApiResponse('Method not allowed', 405);
			}
			const { author_id, tweet_id, tweet_body, thread_id, parent_tweet_id, is_bot_response } = (await request.json()) as XBotTweetsTable;
			if (!author_id || !tweet_id || !tweet_body) {
				return createJsonResponse({ error: 'Missing required fields: authorId, tweetId, tweetBody' }, 400);
			}
			const tweet = await addTweet(
				this.orm,
				author_id,
				tweet_id,
				tweet_body,
				thread_id || undefined,
				parent_tweet_id || undefined,
				is_bot_response || undefined
			);
			return createApiResponse({
				message: 'Successfully created tweet',
				data: { tweet }
			});
		}

		if (endpoint === '/twitter/logs/get') {
			const tweetId = url.searchParams.get('tweetId');
			if (!tweetId) {
				return createJsonResponse('Missing tweetId parameter', 400);
			}
			const logs = await getTweetLogs(this.orm, tweetId);
			return createJsonResponse({
				message: 'Successfully retrieved tweet logs',
				data: logs
			});
		}

		if (endpoint === '/twitter/logs/add') {
			if (request.method !== 'POST') {
				return createApiResponse('Method not allowed', 405);
			}
			const { tweet_id, tweet_status, log_message } = (await request.json()) as XBotLogsTable;
			if (!tweet_id || !tweet_status) {
				return createJsonResponse({ error: 'Missing required fields: tweetId, status' }, 400);
			}
			const log = await addLog(this.orm, tweet_id, tweet_status, log_message || undefined);
			return createJsonResponse({ log });
		}

		// Crew execution steps endpoints
		if (endpoint === '/crews/steps/get') {
			const executionId = url.searchParams.get('executionId');
			if (!executionId) {
				return createJsonResponse({ error: 'Missing executionId parameter' }, 400);
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
			if (!tokenAddress.success) {
				return createJsonResponse({ error: 'Unauthorized access' }, 403);
			}

			const steps = await getExecutionSteps(this.orm, parseInt(executionId));
			return createJsonResponse({ steps });
		}

		if (endpoint === '/crews/steps/create') {
			if (request.method !== 'POST') {
				return createJsonResponse({ error: 'Method not allowed' }, 405);
			}

			// Get the session token from Authorization header
			const authHeader = request.headers.get('Authorization');
			if (!authHeader) {
				return createJsonResponse({ error: 'Missing authorization header' }, 401);
			}

			// Extract token from Bearer format
			const token = authHeader.replace('Bearer ', '');

			// Verify the token
			const tokenAddress = await validateSessionToken(this.env, token);
			if (!tokenAddress) {
				return createJsonResponse({ error: 'Unauthorized access' }, 403);
			}

			const stepData = (await request.json()) as UserCrewExecutionStepsTable;
			if (!stepData.profile_id || !stepData.crew_id || !stepData.execution_id || !stepData.step_type || !stepData.step_data) {
				return createJsonResponse({ error: 'Missing required fields' }, 400);
			}

			// Verify the profile_id matches the token address
			if (stepData.profile_id !== tokenAddress.address) {
				return createJsonResponse({ error: 'Unauthorized: profile_id does not match token' }, 403);
			}

			const step = await createExecutionStep(this.orm, stepData);
			return createJsonResponse({ step });
		}

		if (endpoint === '/crews/steps/delete') {
			if (request.method !== 'DELETE') {
				return createJsonResponse({ error: 'Method not allowed' }, 405);
			}

			const executionId = url.searchParams.get('executionId');
			if (!executionId) {
				return createJsonResponse({ error: 'Missing executionId parameter' }, 400);
			}

			// Get the session token from Authorization header
			const authHeader = request.headers.get('Authorization');
			if (!authHeader) {
				return createJsonResponse({ error: 'Missing authorization header' }, 401);
			}

			// Extract token from Bearer format
			const token = authHeader.replace('Bearer ', '');

			// Verify the token
			const tokenAddress = await validateSessionToken(this.env, token);
			if (!tokenAddress) {
				return createJsonResponse({ error: 'Unauthorized access' }, 403);
			}

			const result = await deleteExecutionSteps(this.orm, parseInt(executionId));
			return createJsonResponse({ result });
		}

		return createApiResponse(
			`Unsupported endpoint: ${endpoint}, supported endpoints: ${this.SUPPORTED_ENDPOINTS.join(', ')}`,
			404
		);
	}
}
