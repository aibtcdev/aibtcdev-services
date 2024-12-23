import { Model, DataTypes, Infer } from 'd1-orm';
import { toCamelCase, toSnakeCase } from '../../utils/case-transformers';

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

// Original type for ORM operations
export type XBotLogsTable = Infer<typeof xBotLogsModel>;

// CamelCase interface for application use
export interface XBotLog {
    id: number;
    createdAt: string;
    tweetId: string;
    tweetStatus?: string;
    logMessage?: string;
}

// Transform functions using generic utility
export const transformToCamelCase = (log: XBotLogsTable): XBotLog => toCamelCase(log);
export const transformToSnakeCase = (log: Partial<XBotLog>): Partial<Omit<XBotLogsTable, 'id' | 'created_at'>> => 
    toSnakeCase(log);
