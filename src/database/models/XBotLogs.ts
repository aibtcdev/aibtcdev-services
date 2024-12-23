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
		updated_at: { type: DataTypes.STRING },
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
	updatedAt: string;
	tweetId: string;
	tweetStatus?: string;
	logMessage?: string;
}

// Transform functions with explicit mapping
export const transformXBotLogToCamelCase = (log: XBotLogsTable): XBotLog => ({
	id: log.id,
	createdAt: log.created_at || '',
	updatedAt: log.updated_at || '',
	tweetId: log.tweet_id,
	tweetStatus: log.tweet_status ?? undefined,
	logMessage: log.log_message ?? undefined,
});

export const transformXBotLogToSnakeCase = (log: Partial<XBotLog>): Partial<Omit<XBotLogsTable, 'id' | 'created_at' | 'updated_at'>> => ({
	tweet_id: log.tweetId,
	tweet_status: log.tweetStatus,
	log_message: log.logMessage,
});
