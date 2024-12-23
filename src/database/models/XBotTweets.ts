import { Model, DataTypes, Infer } from 'd1-orm';

export const xBotTweetsModel = new Model(
	{
		D1Orm: undefined,
		tableName: 'x_bot_tweets',
		primaryKeys: 'id',
		autoIncrement: 'id',
	},
	{
		id: { type: DataTypes.INTEGER, notNull: true },
		created_at: { type: DataTypes.STRING },
		updated_at: { type: DataTypes.STRING },
		author_id: { type: DataTypes.STRING, notNull: true },
		thread_id: { type: DataTypes.INTEGER },
		parent_tweet_id: { type: DataTypes.STRING },
		tweet_id: { type: DataTypes.STRING, notNull: true },
		tweet_created_at: { type: DataTypes.STRING },
		tweet_updated_at: { type: DataTypes.STRING },
		tweet_body: { type: DataTypes.STRING },
		is_bot_response: { type: DataTypes.BOOLEAN },
	}
);

// Original type for ORM operations
export type XBotTweetsTable = Infer<typeof xBotTweetsModel>;

// CamelCase interface for application use
export interface XBotTweet {
	id: number;
	createdAt: string;
	updatedAt: string;
	authorId: string;
	threadId?: number;
	parentTweetId?: string;
	tweetId: string;
	tweetCreatedAt?: string;
	tweetUpdatedAt?: string;
	tweetBody?: string;
	isBotResponse?: boolean;
}

// Transform functions with explicit mapping
export const transformXBotTweetToCamelCase = (tweet: XBotTweetsTable): XBotTweet => ({
	id: tweet.id,
	createdAt: tweet.created_at || '',
	updatedAt: tweet.updated_at || '',
	authorId: tweet.author_id,
	threadId: tweet.thread_id ?? undefined,
	parentTweetId: tweet.parent_tweet_id ?? undefined,
	tweetId: tweet.tweet_id,
	tweetCreatedAt: tweet.tweet_created_at ?? undefined,
	tweetUpdatedAt: tweet.tweet_updated_at ?? undefined,
	tweetBody: tweet.tweet_body ?? undefined,
	isBotResponse: Boolean(tweet.is_bot_response),
});

export const transformXBotTweetToSnakeCase = (
	tweet: Partial<XBotTweet>
): Partial<Omit<XBotTweetsTable, 'id' | 'created_at' | 'updated_at'>> => ({
	author_id: tweet.authorId,
	thread_id: tweet.threadId,
	parent_tweet_id: tweet.parentTweetId,
	tweet_id: tweet.tweetId,
	tweet_created_at: tweet.tweetCreatedAt,
	tweet_updated_at: tweet.tweetUpdatedAt,
	tweet_body: tweet.tweetBody,
	is_bot_response: tweet.isBotResponse ? 1 : 0,
});
