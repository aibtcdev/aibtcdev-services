import { Model, DataTypes, Infer } from 'd1-orm';

export const userAgentsModel = new Model(
	{
		D1Orm: undefined,
		tableName: 'user_agents',
		primaryKeys: 'id',
		autoIncrement: 'id',
	},
	{
		id: { type: DataTypes.INTEGER, notNull: true },
		created_at: { type: DataTypes.STRING },
		updated_at: { type: DataTypes.STRING },
		profile_id: { type: DataTypes.STRING, notNull: true },
		crew_id: { type: DataTypes.INTEGER, notNull: true },
		agent_name: { type: DataTypes.STRING, notNull: true },
		agent_role: { type: DataTypes.STRING, notNull: true },
		agent_goal: { type: DataTypes.STRING, notNull: true },
		agent_backstory: { type: DataTypes.STRING, notNull: true },
		agent_tools: { type: DataTypes.STRING }, // Will store JSON string of tools array
	}
);

// Original type for ORM operations
export type UserAgentsTable = Infer<typeof userAgentsModel>;

// CamelCase interface for application use
export interface UserAgent {
    id: number;
    createdAt: string;
    updatedAt: string;
    profileId: string;
    crewId: number;
    agentName: string;
    agentRole: string;
    agentGoal: string;
    agentBackstory: string;
    agentTools?: string;
}

import { toCamelCase, toSnakeCase } from '../../utils/case-transformers';

// Transform functions using generic utility
export const transformToCamelCase = (agent: UserAgentsTable): UserAgent => toCamelCase(agent);
export const transformToSnakeCase = (agent: Partial<UserAgent>): Partial<Omit<UserAgentsTable, 'id' | 'created_at' | 'updated_at'>> => 
    toSnakeCase(agent);
