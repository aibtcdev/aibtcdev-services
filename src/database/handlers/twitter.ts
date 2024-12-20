import { Handler } from './types';
import { createApiResponse } from '../../utils/requests-responses';
import { getAuthor, addAuthor, getTweet, getThreadTweets, getAuthorTweets, addTweet, getTweetLogs, addLog } from '../helpers/twitter';
import { XBotAuthorsTable, XBotTweetsTable, XBotLogsTable } from '../models';

export const handleTwitter: Handler = async ({ orm, request, url }) => {
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
};
