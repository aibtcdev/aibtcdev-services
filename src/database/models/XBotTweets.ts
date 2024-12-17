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

export type XBotTweetsTable = Infer<typeof xBotTweetsModel>;
