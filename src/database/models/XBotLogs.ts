import { Model, DataTypes, Infer } from 'd1-orm';

export const xBotLogsModel = new Model(
    {
        D1Orm: undefined,
        tableName: 'x_bot_logs',
        primaryKeys: 'id',
        autoIncrement: 'id',
    },
    {
        id: { type: DataTypes.INTEGER, notNull: true },
        created_at: { type: DataTypes.STRING },
        tweet_id: { type: DataTypes.STRING, notNull: true },
        tweet_status: { type: DataTypes.STRING },
        log_message: { type: DataTypes.STRING },
    }
);

export type XBotLogsTable = Infer<typeof xBotLogsModel>;
