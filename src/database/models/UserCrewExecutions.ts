import { Model, DataTypes, Infer } from 'd1-orm';

export const userCrewExecutionsModel = new Model(
	{
		D1Orm: undefined,
		tableName: 'user_crew_executions',
		primaryKeys: 'id',
		autoIncrement: 'id',
	},
	{
		id: { type: DataTypes.INTEGER, notNull: true },
		created_at: { type: DataTypes.STRING },
		updated_at: { type: DataTypes.STRING },
		profile_id: { type: DataTypes.STRING, notNull: true },
		crew_id: { type: DataTypes.INTEGER, notNull: true },
		conversation_id: { type: DataTypes.INTEGER, notNull: true },
		user_input: { type: DataTypes.STRING },
		final_result: { type: DataTypes.STRING },
		total_tokens: { type: DataTypes.INTEGER },
		successful_requests: { type: DataTypes.INTEGER },
	}
);

// Original type for ORM operations
export type UserCrewExecutionsTable = Infer<typeof userCrewExecutionsModel>;

// CamelCase interface for application use
export interface UserCrewExecution {
	id: number;
	createdAt: string;
	updatedAt: string;
	profileId: string;
	crewId: number;
	conversationId: number;
	userInput?: string;
	finalResult?: string;
	totalTokens?: number;
	successfulRequests?: number;
}

// Transform functions with explicit mapping
export const transformUserCrewExecutionToCamelCase = (execution: UserCrewExecutionsTable): UserCrewExecution => ({
	id: execution.id,
	createdAt: execution.created_at || '',
	updatedAt: execution.updated_at || '',
	profileId: execution.profile_id,
	crewId: execution.crew_id,
	conversationId: execution.conversation_id,
	userInput: execution.user_input ?? undefined,
	finalResult: execution.final_result ?? undefined,
	totalTokens: execution.total_tokens ?? undefined,
	successfulRequests: execution.successful_requests ?? undefined,
});

export const transformUserCrewExecutionToSnakeCase = (
	execution: Partial<UserCrewExecution>
): Partial<Omit<UserCrewExecutionsTable, 'id' | 'created_at' | 'updated_at'>> => ({
	profile_id: execution.profileId,
	crew_id: execution.crewId,
	conversation_id: execution.conversationId,
	user_input: execution.userInput,
	final_result: execution.finalResult,
	total_tokens: execution.totalTokens,
	successful_requests: execution.successfulRequests,
});
