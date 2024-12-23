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
				authorId: 'Twitter author ID to retrieve'
			}
		},
		{
			path: '/twitter/create',
			methods: ['POST'],
			description: 'Create a new author',
			requiresAuth: true,
			requestBody: {
				author_id: 'Twitter author ID',
				realname: 'Optional: Real name of the author',
				username: 'Optional: Twitter username'
			}
		},
		{
			path: '/twitter/tweet',
			methods: ['GET'],
			description: 'Get tweet by ID',
			requiresAuth: true,
			parameters: {
				tweetId: 'Twitter tweet ID to retrieve'
			}
		},
		{
			path: '/twitter/thread',
			methods: ['GET'],
			description: 'Get tweets in a thread',
			requiresAuth: true,
			parameters: {
				threadId: 'Thread ID to retrieve tweets from'
			}
		},
		{
			path: '/twitter/author-tweets',
			methods: ['GET'],
			description: 'Get tweets by author',
			requiresAuth: true,
			parameters: {
				authorId: 'Twitter author ID to get tweets for'
			}
		},
		{
			path: '/twitter/add-tweet',
			methods: ['POST'],
			description: 'Add a new tweet',
			requiresAuth: true,
			requestBody: {
				author_id: 'Twitter author ID',
				tweet_id: 'Twitter tweet ID',
				tweet_body: 'Content of the tweet',
				thread_id: 'Optional: Thread ID if part of a thread',
				parent_tweet_id: 'Optional: ID of parent tweet if reply',
				is_bot_response: 'Optional: Boolean indicating if tweet is bot response'
			}
		},
		{
			path: '/twitter/logs',
			methods: ['GET'],
			description: 'Get logs for a tweet',
			requiresAuth: true,
			parameters: {
				tweetId: 'Tweet ID to get logs for'
			}
		},
		{
			path: '/twitter/add-log',
			methods: ['POST'],
			description: 'Add a new log entry',
			requiresAuth: true,
			requestBody: {
				tweet_id: 'Tweet ID to add log for',
				tweet_status: 'Status of the tweet',
				log_message: 'Optional: Additional log message'
			}
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
				const { author_id, realname, username } = (await request.json()) as XBotAuthorsTable;
				if (!author_id) {
					return createApiResponse('Missing required fields: authorId', 400);
				}
				const author = await addAuthor(orm, author_id, realname || undefined, username || undefined);
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
				const { author_id, tweet_id, tweet_body, thread_id, parent_tweet_id, is_bot_response } = (await request.json()) as XBotTweetsTable;
				if (!author_id || !tweet_id || !tweet_body) {
					return createApiResponse('Missing required fields: authorId, tweetId, tweetBody', 400);
				}
				const tweet = await addTweet(
					orm,
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
				const { tweet_id, tweet_status, log_message } = (await request.json()) as XBotLogsTable;
				if (!tweet_id || !tweet_status) {
					return createApiResponse('Missing required fields: tweetId, status', 400);
				}
				const log = await addLog(orm, tweet_id, tweet_status, log_message || undefined);
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
