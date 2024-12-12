import { D1Orm } from 'd1-orm';
import { userAgentsModel, userTasksModel } from '../models';

/** AGENT MANAGEMENT */

/**
 * Get all agents for a specific crew
 * @param orm The D1Orm instance
 * @param crewId The ID of the crew to get agents for
 * @returns Promise containing array of agents and metadata
 */
export async function getAgents(orm: D1Orm, crewId: number): Promise<{results: any[]}> {
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
        return agents;
    } catch (error) {
        console.error(`Error in getAgents: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    }
}

/**
 * Create a new agent
 * @param orm The D1Orm instance
 * @param agentData The agent data to create
 * @returns Promise containing the created agent
 */
export async function createAgent(orm: D1Orm, agentData: {
    profile_id: string;
    crew_id: number;
    agent_name: string;
    agent_role: string;
    agent_goal: string;
    agent_backstory: string;
    agent_tools?: string;
}) {
    userAgentsModel.SetOrm(orm);
    const agent = await userAgentsModel.InsertOne(agentData);
    return agent;
}

/**
 * Update an existing agent
 */
export async function updateAgent(orm: D1Orm, agentId: number, updates: {
    agent_name?: string;
    agent_role?: string;
    agent_goal?: string;
    agent_backstory?: string;
    agent_tools?: string;
}) {
    userAgentsModel.SetOrm(orm);
    const result = await userAgentsModel.Update({
        where: {
            id: agentId
        },
        data: updates
    });
    return result;
}

/**
 * Delete an agent and all associated tasks
 */
export async function deleteAgent(orm: D1Orm, agentId: number) {
    userTasksModel.SetOrm(orm);
    userAgentsModel.SetOrm(orm);
    
    // First delete all tasks associated with this agent
    await userTasksModel.Delete({
        where: {
            agent_id: agentId
        }
    });
    
    // Then delete the agent
    const result = await userAgentsModel.Delete({
        where: {
            id: agentId
        }
    });
    return result;
}
