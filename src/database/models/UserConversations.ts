import { Model, DataTypes, Infer } from 'd1-orm';

export const userConversationsModel = new Model(
	{
		D1Orm: undefined,
		tableName: 'user_conversations',
		primaryKeys: 'id',
		autoIncrement: 'id',
	},
	{
		id: { type: DataTypes.INTEGER, notNull: true },
		created_at: { type: DataTypes.STRING },
		updated_at: { type: DataTypes.STRING },
		profile_id: { type: DataTypes.STRING, notNull: true },
		conversation_name: { type: DataTypes.STRING, notNull: true },
	}
);

// Original type for ORM operations
export type UserConversationsTable = Infer<typeof userConversationsModel>;

// CamelCase interface for application use
export interface UserConversation {
	id: number;
	createdAt: string;
	updatedAt: string;
	profileId: string;
	conversationName: string;
}

// Transform functions with explicit mapping
export const transformUserConversationToCamelCase = (conversation: UserConversationsTable): UserConversation => ({
	id: conversation.id,
	createdAt: conversation.created_at || '',
	updatedAt: conversation.updated_at || '',
	profileId: conversation.profile_id,
	conversationName: conversation.conversation_name,
});

export const transformUserConversationToSnakeCase = (
	conversation: Partial<UserConversation>
): Partial<Omit<UserConversationsTable, 'id' | 'created_at' | 'updated_at'>> => ({
	profile_id: conversation.profileId,
	conversation_name: conversation.conversationName,
});
