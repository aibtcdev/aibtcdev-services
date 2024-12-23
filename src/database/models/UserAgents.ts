import { Model, DataTypes, Infer } from 'd1-orm';
import { toCamelCase, toSnakeCase } from '../../utils/case-transformers';

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

// Transform functions using generic utility
export const transformUserAgentToCamelCase = (agent: UserAgentsTable): UserAgent => ({
	id: agent.id,
	createdAt: agent.created_at || '',
	updatedAt: agent.updated_at || '',
	profileId: agent.profile_id,
	crewId: agent.crew_id,
	agentName: agent.agent_name,
	agentRole: agent.agent_role,
	agentGoal: agent.agent_goal,
	agentBackstory: agent.agent_backstory,
	agentTools: agent.agent_tools ?? undefined,
});

export const transformUserAgentToSnakeCase = (
	agent: Partial<UserAgent>
): Partial<Omit<UserAgentsTable, 'id' | 'created_at' | 'updated_at'>> => ({
	profile_id: agent.profileId,
	crew_id: agent.crewId,
	agent_name: agent.agentName,
	agent_role: agent.agentRole,
	agent_goal: agent.agentGoal,
	agent_backstory: agent.agentBackstory,
	agent_tools: agent.agentTools,
});
