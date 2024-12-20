import { DurableObject } from 'cloudflare:workers';
import { Env } from '../../worker-configuration';
import { AppConfig } from '../config';
import { createApiResponse, createUnsupportedEndpointResponse } from '../utils/requests-responses';
import { getHandler } from './handlers';
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
				message: 'database service',
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

		try {
			// pass off to handler
			if (endpoint.startsWith('/conversations')) {
				const handler = getHandler(endpoint);
				if (handler) {
					return handler({
						orm: this.orm,
						env: this.env,
						request,
						url,
					});
				}
			}

			if (endpoint.startsWith('/crews')) {
				const handler = getHandler(endpoint);
				if (handler) {
					return handler({
						orm: this.orm,
						env: this.env,
						request,
						url,
					});
				}
			}

			if (endpoint.startsWith('/agents')) {
				const handler = getHandler(endpoint);
				if (handler) {
					return handler({
						orm: this.orm,
						env: this.env,
						request,
						url,
					});
				}
			}

			// Pass off to tasks handler
			if (endpoint.startsWith('/tasks')) {
				const handler = getHandler(endpoint);
				if (handler) {
					return handler({
						orm: this.orm,
						env: this.env,
						request,
						url,
					});
				}
			}


			// Pass off to crons handler
			if (endpoint.startsWith('/crons')) {
				const handler = getHandler(endpoint);
				if (handler) {
					return handler({
						orm: this.orm,
						env: this.env,
						request,
						url,
					});
				}
			}

			// Pass off to profiles handler
			if (endpoint.startsWith('/profiles')) {
				const handler = getHandler(endpoint);
				if (handler) {
					return handler({
						orm: this.orm,
						env: this.env,
						request,
						url,
					});
				}
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
				data: { author },
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
				data: { author },
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
				data: { tweet },
			});
		}

		if (endpoint === '/twitter/tweets/thread') {
			const threadId = url.searchParams.get('threadId');
			if (!threadId) {
				return createApiResponse('Missing threadId parameter', 400);
			}
			const tweets = await getThreadTweets(this.orm, parseInt(threadId));
			return createApiResponse({
				message: 'Successfully retrieved thread tweets',
				data: { tweets },
			});
		}

		if (endpoint === '/twitter/tweets/author') {
			const authorId = url.searchParams.get('authorId');
			if (!authorId) {
				return createApiResponse('Missing authorId parameter', 400);
			}
			const tweets = await getAuthorTweets(this.orm, authorId);
			return createApiResponse({
				message: 'Successfully retrieved author tweets',
				data: { tweets },
			});
		}

		if (endpoint === '/twitter/tweets/add') {
			if (request.method !== 'POST') {
				return createApiResponse('Method not allowed', 405);
			}
			const { author_id, tweet_id, tweet_body, thread_id, parent_tweet_id, is_bot_response } = (await request.json()) as XBotTweetsTable;
			if (!author_id || !tweet_id || !tweet_body) {
				return createApiResponse('Missing required fields: authorId, tweetId, tweetBody', 400);
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
				data: { tweet },
			});
		}

		if (endpoint === '/twitter/logs/get') {
			const tweetId = url.searchParams.get('tweetId');
			if (!tweetId) {
				return createApiResponse('Missing tweetId parameter', 400);
			}
			const logs = await getTweetLogs(this.orm, tweetId);
			return createApiResponse({
				message: 'Successfully retrieved tweet logs',
				data: { logs },
			});
		}

		if (endpoint === '/twitter/logs/add') {
			if (request.method !== 'POST') {
				return createApiResponse('Method not allowed', 405);
			}
			const { tweet_id, tweet_status, log_message } = (await request.json()) as XBotLogsTable;
			if (!tweet_id || !tweet_status) {
				return createApiResponse('Missing required fields: tweetId, status', 400);
			}
			const log = await addLog(this.orm, tweet_id, tweet_status, log_message || undefined);
			return createApiResponse({
				message: 'Successfully created log',
				data: { log },
			});
		}


		return createUnsupportedEndpointResponse(endpoint, this.SUPPORTED_ENDPOINTS);
	}
}
