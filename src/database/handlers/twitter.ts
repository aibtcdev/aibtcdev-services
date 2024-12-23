import { HandlerDefinition } from './types';
import { createApiResponse } from '../../utils/requests-responses';
import { getAuthor, addAuthor, getTweet, getThreadTweets, getAuthorTweets, addTweet, getTweetLogs, addLog } from '../helpers/twitter';
import { XBotAuthorsTable, XBotTweetsTable, XBotLogsTable } from '../models';

export const twitterHandler: HandlerDefinition = {
	baseRoute: 'twitter',
	endpoints: [
		{
			path: '/twitter/get',
			methods: ['GET'],
			description: 'Get author by ID',
			requiresAuth: true,
			parameters: {
				authorId: 'Twitter author ID to retrieve',
			},
		},
		{
			path: '/twitter/create',
			methods: ['POST'],
			description: 'Create a new author',
			requiresAuth: true,
			requestBody: {
				authorId: 'Twitter author ID',
				realName: 'Optional: Real name of the author',
				username: 'Optional: Twitter username',
			},
		},
		{
			path: '/twitter/tweet',
			methods: ['GET'],
			description: 'Get tweet by ID',
			requiresAuth: true,
			parameters: {
				tweetId: 'Twitter tweet ID to retrieve',
			},
		},
		{
			path: '/twitter/thread',
			methods: ['GET'],
			description: 'Get tweets in a thread',
			requiresAuth: true,
			parameters: {
				threadId: 'Thread ID to retrieve tweets from',
			},
		},
		{
			path: '/twitter/author-tweets',
			methods: ['GET'],
			description: 'Get tweets by author',
			requiresAuth: true,
			parameters: {
				authorId: 'Twitter author ID to get tweets for',
			},
		},
		{
			path: '/twitter/add-tweet',
			methods: ['POST'],
			description: 'Add a new tweet',
			requiresAuth: true,
			requestBody: {
				authorId: 'Twitter author ID',
				tweetId: 'Twitter tweet ID',
				tweetBody: 'Content of the tweet',
				threadId: 'Optional: Thread ID if part of a thread',
				parentTweetId: 'Optional: ID of parent tweet if reply',
				isBotResponse: 'Optional: Boolean indicating if tweet is bot response',
			},
		},
		{
			path: '/twitter/logs',
			methods: ['GET'],
			description: 'Get logs for a tweet',
			requiresAuth: true,
			parameters: {
				tweetId: 'Tweet ID to get logs for',
			},
		},
		{
			path: '/twitter/add-log',
			methods: ['POST'],
			description: 'Add a new log entry',
			requiresAuth: true,
			requestBody: {
				tweetId: 'Tweet ID to add log for',
				tweetStatus: 'Status of the tweet',
				logMessage: 'Optional: Additional log message',
			},
		},
	],
	handler: async ({ orm, request, url }) => {
		const endpoint = url.pathname.split('/').pop();

		switch (endpoint) {
			case 'get': {
				const authorId = url.searchParams.get('authorId');
				if (!authorId) {
					return createApiResponse('Missing authorId parameter', 400);
				}
				const author = await getAuthor(orm, authorId);
				return createApiResponse({
					message: 'Successfully retrieved author',
					data: { author },
				});
			}

			case 'create': {
				if (request.method !== 'POST') {
					return createApiResponse('Method not allowed', 405);
				}
				const { author_id: authorId, realname, username } = (await request.json()) as XBotAuthorsTable;
				if (!authorId) {
					return createApiResponse('Missing required fields: authorId', 400);
				}
				const author = await addAuthor(orm, authorId, realname || undefined, username || undefined);
				return createApiResponse({
					message: 'Successfully created author',
					data: { author },
				});
			}

			case 'tweet': {
				const tweetId = url.searchParams.get('tweetId');
				if (!tweetId) {
					return createApiResponse('Missing tweetId parameter', 400);
				}
				const tweet = await getTweet(orm, tweetId);
				return createApiResponse({
					message: 'Successfully retrieved tweet',
					data: { tweet },
				});
			}

			case 'thread': {
				const threadId = url.searchParams.get('threadId');
				if (!threadId) {
					return createApiResponse('Missing threadId parameter', 400);
				}
				const tweets = await getThreadTweets(orm, parseInt(threadId));
				return createApiResponse({
					message: 'Successfully retrieved thread tweets',
					data: { tweets },
				});
			}

			case 'author-tweets': {
				const authorId = url.searchParams.get('authorId');
				if (!authorId) {
					return createApiResponse('Missing authorId parameter', 400);
				}
				const tweets = await getAuthorTweets(orm, authorId);
				return createApiResponse({
					message: 'Successfully retrieved author tweets',
					data: { tweets },
				});
			}

			case 'add-tweet': {
				if (request.method !== 'POST') {
					return createApiResponse('Method not allowed', 405);
				}
				const {
					author_id: authorId,
					tweet_id: tweetId,
					tweet_body: tweetBody,
					thread_id: threadId,
					parent_tweet_id: parentTweetId,
					is_bot_response: isBotResponse,
				} = (await request.json()) as XBotTweetsTable;
				if (!authorId || !tweetId || !tweetBody) {
					return createApiResponse('Missing required fields: authorId, tweetId, tweetBody', 400);
				}
				const tweet = await addTweet(
					orm,
					authorId,
					tweetId,
					tweetBody,
					threadId || undefined,
					parentTweetId || undefined,
					isBotResponse || undefined
				);
				return createApiResponse({
					message: 'Successfully created tweet',
					data: { tweet },
				});
			}

			case 'logs': {
				const tweetId = url.searchParams.get('tweetId');
				if (!tweetId) {
					return createApiResponse('Missing tweetId parameter', 400);
				}
				const logs = await getTweetLogs(orm, tweetId);
				return createApiResponse({
					message: 'Successfully retrieved tweet logs',
					data: { logs },
				});
			}

			case 'add-log': {
				if (request.method !== 'POST') {
					return createApiResponse('Method not allowed', 405);
				}
				const { tweet_id: tweetId, tweet_status: tweetStatus, log_message: logMessage } = (await request.json()) as XBotLogsTable;
				if (!tweetId || !tweetStatus) {
					return createApiResponse('Missing required fields: tweetId, status', 400);
				}
				const log = await addLog(orm, tweetId, tweetStatus, logMessage || undefined);
				return createApiResponse({
					message: 'Successfully created log',
					data: { log },
				});
			}

			default:
				return createApiResponse(`Unsupported twitter endpoint: ${endpoint}`, 404);
		}
	},
};
