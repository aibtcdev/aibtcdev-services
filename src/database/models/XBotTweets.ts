import { Model, DataTypes, Infer } from 'd1-orm';
import { toCamelCase, toSnakeCase } from '../../utils/case-transformers';

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

// Transform functions using generic utility
export const transformXBotTweetToCamelCase = (tweet: XBotTweetsTable): XBotTweet => toCamelCase(tweet);
export const transformXBotTweetToSnakeCase = (tweet: Partial<XBotTweet>): Partial<Omit<XBotTweetsTable, 'id' | 'created_at' | 'updated_at'>> => 
    toSnakeCase(tweet);
