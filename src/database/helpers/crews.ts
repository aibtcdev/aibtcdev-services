import { D1Orm } from 'd1-orm';
import { userCrewExecutionsModel, userCrewsModel, UserCrewsTable, UserCrewExecutionsTable } from '../models';

/** CREW MANAGEMENT */

interface CrewResult {
    crew?: UserCrewsTable;
    crews?: UserCrewsTable[];
    execution?: UserCrewExecutionsTable;
    executions?: UserCrewExecutionsTable[];
    success: boolean;
    error?: string;
}

/**
 * Create a new crew execution (run) for a profile
 * @param orm The D1Orm instance from durable object class
 * @param address The Stacks address for the user's profile
 * @param crewId The ID of the crew being executed
 * @param conversationId The ID of the conversation this execution belongs to
 * @param input Optional user input for the execution
 * @returns Promise containing the created execution or error details
 * @throws Error if database insertion fails
 */
export async function addCrewExecution(
    orm: D1Orm, 
    address: string, 
    crewId: number, 
    conversationId: number, 
    input?: string
): Promise<CrewResult> {
    try {
        userCrewExecutionsModel.SetOrm(orm);
        const execution = await userCrewExecutionsModel.InsertOne({
            profile_id: address,
            crew_id: crewId,
            conversation_id: conversationId,
            user_input: input,
            total_tokens: 0,
            successful_requests: 0,
        });
        return {
            execution: execution as unknown as UserCrewExecutionsTable,
            success: true
        };
    } catch (error) {
        console.error(`Error in addCrewExecution: ${error instanceof Error ? error.message : String(error)}`);
        return {
            success: false,
            error: `Failed to create crew execution: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}

/**
 * Get all executed crew runs for a profile
 * @param orm The D1Orm instance from durable object class
 * @param address The Stacks address for the user's profile
 * @returns Promise containing array of executions or error details
 * @throws Error if database query fails
 */
export async function getCrewExecutions(orm: D1Orm, address: string): Promise<CrewResult> {
    try {
        userCrewExecutionsModel.SetOrm(orm);
        const result = await userCrewExecutionsModel.All({
            where: {
                profile_id: address,
            },
            orderBy: [
                {
                    column: 'created_at',
                    descending: true,
                },
            ],
        });
        return {
            executions: result.results as unknown as UserCrewExecutionsTable[],
            success: true
        };
    } catch (error) {
        console.error(`Error in getCrewExecutions: ${error instanceof Error ? error.message : String(error)}`);
        return {
            executions: [],
            success: false,
            error: `Failed to get crew executions: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}

/**
 * Get all public crew configurations
 * @param orm The D1Orm instance from durable object class
 * @returns Promise containing array of public crews or error details
 * @throws Error if database query fails
 */
export async function getPublicCrews(orm: D1Orm): Promise<CrewResult> {
    try {
        userCrewsModel.SetOrm(orm);
        const result = await userCrewsModel.All({
            where: {
                crew_is_public: 1,
            },
            orderBy: [
                {
                    column: 'created_at',
                    descending: true,
                },
            ],
        });
        return {
            crews: result.results as unknown as UserCrewsTable[],
            success: true
        };
    } catch (error) {
        console.error(`Error in getPublicCrews: ${error instanceof Error ? error.message : String(error)}`);
        return {
            crews: [],
            success: false,
            error: `Failed to get public crews: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}

/**
 * Get a specific crew by ID
 * @param orm The D1Orm instance from durable object class
 * @param crewId The ID of the crew to retrieve
 * @returns Promise containing the crew data or error details
 * @throws Error if database query fails
 */
export async function getCrew(orm: D1Orm, crewId: number): Promise<CrewResult> {
    try {
        userCrewsModel.SetOrm(orm);
        const crew = await userCrewsModel.First({
            where: {
                id: crewId
            }
        });
        return {
            crew: crew as unknown as UserCrewsTable,
            success: true
        };
    } catch (error) {
        console.error(`Error in getCrew: ${error instanceof Error ? error.message : String(error)}`);
        return {
            success: false,
            error: `Failed to get crew: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}

/**
 * Create a new crew
 * @param orm The D1Orm instance from durable object class
 * @param crewData The crew configuration data
 * @returns Promise containing the created crew or error details
 * @throws Error if database insertion fails
 */
export async function createCrew(orm: D1Orm, crewData: Omit<UserCrewsTable, 'id' | 'created_at' | 'updated_at' | 'crew_executions' | 'crew_is_cron'>): Promise<CrewResult> {
    try {
        userCrewsModel.SetOrm(orm);
        const crew = await userCrewsModel.InsertOne(crewData);
        return {
            crew: crew as unknown as UserCrewsTable,
            success: true
        };
    } catch (error) {
        console.error(`Error in createCrew: ${error instanceof Error ? error.message : String(error)}`);
        return {
            success: false,
            error: `Failed to create crew: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}

/**
 * Update an existing crew
 * @param orm The D1Orm instance from durable object class
 * @param crewId The ID of the crew to update
 * @param updates The fields to update on the crew
 * @returns Promise containing the update result or error details
 * @throws Error if database update fails
 */
export async function updateCrew(
    orm: D1Orm, 
    crewId: number, 
    updates: Partial<Pick<UserCrewsTable, 'crew_name' | 'crew_description' | 'crew_is_public'>>
): Promise<CrewResult> {
    try {
        userCrewsModel.SetOrm(orm);
        await userCrewsModel.Update({
            where: {
                id: crewId
            },
            data: updates
        });
        return {
            success: true
        };
    } catch (error) {
        console.error(`Error in updateCrew: ${error instanceof Error ? error.message : String(error)}`);
        return {
            success: false,
            error: `Failed to update crew: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}

/**
 * Delete a crew and all associated data
 * @param orm The D1Orm instance from durable object class
 * @param crewId The ID of the crew to delete
 * @returns Promise containing the deletion result or error details
 * @throws Error if database deletion fails
 * @note Due to CASCADE DELETE in schema, deleting the crew will automatically delete:
 * - Associated agents (user_agents)
 * - Associated tasks (user_tasks) 
 * - Associated executions (user_crew_executions)
 * - Associated execution steps (user_crew_execution_steps)
 * - Associated crons (user_crons)
 */
export async function deleteCrew(orm: D1Orm, crewId: number): Promise<CrewResult> {
    try {
        userCrewsModel.SetOrm(orm);
        await userCrewsModel.Delete({
            where: {
                id: crewId
            }
        });
        return {
            success: true
        };
    } catch (error) {
        console.error(`Error in deleteCrew: ${error instanceof Error ? error.message : String(error)}`);
        return {
            success: false,
            error: `Failed to delete crew: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}

/**
 * Get all crews for a profile
 * @param orm The D1Orm instance from durable object class
 * @param address The Stacks address for the user's profile
 * @returns Promise containing array of crews or error details
 * @throws Error if database query fails
 */
/**
 * Get all execution steps for a specific execution
 * @param orm The D1Orm instance from durable object class
 * @param executionId The ID of the execution to get steps for
 * @returns Promise containing array of execution steps or error details
 */
export async function getExecutionSteps(orm: D1Orm, executionId: number): Promise<CrewResult> {
    try {
        userCrewExecutionStepsModel.SetOrm(orm);
        const result = await userCrewExecutionStepsModel.All({
            where: {
                execution_id: executionId
            },
            orderBy: [
                {
                    column: 'created_at',
                    ascending: true,
                },
            ],
        });
        return {
            steps: result.results as unknown as UserCrewExecutionStepsTable[],
            success: true
        };
    } catch (error) {
        console.error(`Error in getExecutionSteps: ${error instanceof Error ? error.message : String(error)}`);
        return {
            steps: [],
            success: false,
            error: `Failed to get execution steps: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}

/**
 * Create a new execution step
 * @param orm The D1Orm instance from durable object class
 * @param stepData The step data to create
 * @returns Promise containing the created step or error details
 */
export async function createExecutionStep(
    orm: D1Orm, 
    stepData: Omit<UserCrewExecutionStepsTable, 'id' | 'created_at' | 'updated_at'>
): Promise<CrewResult> {
    try {
        userCrewExecutionStepsModel.SetOrm(orm);
        const step = await userCrewExecutionStepsModel.InsertOne(stepData);
        return {
            step: step as unknown as UserCrewExecutionStepsTable,
            success: true
        };
    } catch (error) {
        console.error(`Error in createExecutionStep: ${error instanceof Error ? error.message : String(error)}`);
        return {
            success: false,
            error: `Failed to create execution step: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}

/**
 * Delete all execution steps for a specific execution
 * @param orm The D1Orm instance from durable object class
 * @param executionId The ID of the execution to delete steps for
 * @returns Promise containing the deletion result or error details
 */
export async function deleteExecutionSteps(orm: D1Orm, executionId: number): Promise<CrewResult> {
    try {
        userCrewExecutionStepsModel.SetOrm(orm);
        await userCrewExecutionStepsModel.Delete({
            where: {
                execution_id: executionId
            }
        });
        return {
            success: true
        };
    } catch (error) {
        console.error(`Error in deleteExecutionSteps: ${error instanceof Error ? error.message : String(error)}`);
        return {
            success: false,
            error: `Failed to delete execution steps: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}

export async function getCrewsByProfile(orm: D1Orm, address: string): Promise<CrewResult> {
    try {
        userCrewsModel.SetOrm(orm);
        const result = await userCrewsModel.All({
            where: {
                profile_id: address
            },
            orderBy: [
                {
                    column: 'created_at',
                    descending: true,
                },
            ],
        });
        return {
            crews: result.results as unknown as UserCrewsTable[],
            success: true
        };
    } catch (error) {
        console.error(`Error in getCrewsByProfile: ${error instanceof Error ? error.message : String(error)}`);
        return {
            crews: [],
            success: false,
            error: `Failed to get crews for profile: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}
