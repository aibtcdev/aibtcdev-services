import { Model, DataTypes, Infer } from 'd1-orm';

const schema = {
	id: { type: DataTypes.INTEGER, notNull: true },
	created_at: { type: DataTypes.STRING },
	updated_at: { type: DataTypes.STRING },
	profile_id: { type: DataTypes.STRING, notNull: true },
	conversation_name: { type: DataTypes.STRING, notNull: true },
};

export const userConversationsModel = new Model(
	{
		D1Orm: undefined,
		tableName: 'user_conversations',
		primaryKeys: 'id',
		autoIncrement: 'id',
	},
	schema
);

export type UserConversationsTable = Infer<typeof userConversationsModel>;
