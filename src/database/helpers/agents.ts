import { D1Orm } from 'd1-orm';
import { userAgentsModel, userTasksModel } from '../models';

/** AGENT MANAGEMENT */

interface AgentData {
    id: number;
    created_at: string;
    updated_at: string;
    profile_id: string;
    crew_id: number;
    agent_name: string;
    agent_role: string;
    agent_goal: string;
    agent_backstory: string;
    agent_tools?: string;
}

interface AgentResult {
    results: AgentData[];
    success: boolean;
    error?: string;
}

/**
 * Get all agents for a specific crew
 * @param orm The D1Orm instance from durable object class
 * @param crewId The ID of the crew to get agents for
 * @returns Promise containing array of agents and metadata
 * @throws Error if database query fails
 */
export async function getAgents(orm: D1Orm, crewId: number): Promise<AgentResult> {
    try {
        userAgentsModel.SetOrm(orm);
        const agents = await userAgentsModel.All({
            where: {
                crew_id: crewId
            },
            orderBy: [
                {
                    column: 'created_at',
                    descending: true,
                },
            ],
        });
        return {
            results: agents.results as AgentData[],
            success: true
        };
    } catch (error) {
        console.error(`Error in getAgents: ${error instanceof Error ? error.message : String(error)}`);
        return {
            results: [],
            success: false,
            error: `Failed to get agents: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}

/**
 * Create a new agent
 * @param orm The D1Orm instance from durable object class
 * @param agentData The agent configuration data
 * @returns Promise containing the created agent or error details
 * @throws Error if database insertion fails
 */
export async function createAgent(orm: D1Orm, agentData: Omit<AgentData, 'id' | 'created_at' | 'updated_at'>): Promise<{
    agent?: AgentData;
    success: boolean;
    error?: string;
}> {
    try {
        userAgentsModel.SetOrm(orm);
        const agent = await userAgentsModel.InsertOne(agentData);
        return {
            agent: agent as AgentData,
            success: true
        };
    } catch (error) {
        console.error(`Error in createAgent: ${error instanceof Error ? error.message : String(error)}`);
        return {
            success: false,
            error: `Failed to create agent: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}

/**
 * Update an existing agent's configuration
 * @param orm The D1Orm instance from durable object class
 * @param agentId The ID of the agent to update
 * @param updates The fields to update on the agent
 * @returns Promise containing the update result or error details
 * @throws Error if database update fails
 */
export async function updateAgent(orm: D1Orm, agentId: number, updates: Partial<Omit<AgentData, 'id' | 'created_at' | 'updated_at' | 'profile_id' | 'crew_id'>>): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        userAgentsModel.SetOrm(orm);
        await userAgentsModel.Update({
            where: {
                id: agentId
            },
            data: updates
        });
        return {
            success: true
        };
    } catch (error) {
        console.error(`Error in updateAgent: ${error instanceof Error ? error.message : String(error)}`);
        return {
            success: false,
            error: `Failed to update agent: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}

/**
 * Delete an agent and all associated tasks
 * @param orm The D1Orm instance from durable object class
 * @param agentId The ID of the agent to delete
 * @returns Promise containing the deletion result or error details
 * @throws Error if database deletion fails
 */
export async function deleteAgent(orm: D1Orm, agentId: number): Promise<{
    success: boolean;
    error?: string;
}> {
    try {
        userTasksModel.SetOrm(orm);
        userAgentsModel.SetOrm(orm);
        
        // First delete all tasks associated with this agent
        await userTasksModel.Delete({
            where: {
                agent_id: agentId
            }
        });
        
        // Then delete the agent
        await userAgentsModel.Delete({
            where: {
                id: agentId
            }
        });
        
        return {
            success: true
        };
    } catch (error) {
        console.error(`Error in deleteAgent: ${error instanceof Error ? error.message : String(error)}`);
        return {
            success: false,
            error: `Failed to delete agent: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}
