import { Model, DataTypes, Infer } from 'd1-orm';
import { toCamelCase, toSnakeCase } from '../../utils/case-transformers';

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

// Transform functions using generic utility
export const transformToCamelCase = (execution: UserCrewExecutionsTable): UserCrewExecution => toCamelCase(execution);
export const transformToSnakeCase = (execution: Partial<UserCrewExecution>): Partial<Omit<UserCrewExecutionsTable, 'id' | 'created_at' | 'updated_at'>> => 
    toSnakeCase(execution);
