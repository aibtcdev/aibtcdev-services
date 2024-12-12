import { D1Orm } from 'd1-orm';
import { userAgentsModel, userCrewsModel, userCronsModel, userProfilesModel, userTasksModel } from '../models';

/** CRON MANAGEMENT */

interface CronData {
    id: number;
    created_at: string;
    updated_at: string;
    profile_id: string;
    crew_id: number;
    cron_last_run: string | null;
    cron_next_run: string | null;
    cron_enabled: number;
    cron_interval: string;
    cron_input: string;
}

interface CronResult {
    cron?: CronData;
    crons?: CronData[];
    success: boolean;
    error?: string;
}

/**
 * Get all enabled cron jobs
 * @param orm The D1Orm instance from durable object class
 * @returns Promise containing array of enabled crons or error details
 * @throws Error if database query fails
 */
export async function getEnabledCrons(orm: D1Orm): Promise<CronResult> {
    try {
        userCronsModel.SetOrm(orm);
        const result = await userCronsModel.All({
            where: {
                cron_enabled: 1,
            },
            orderBy: [
                {
                    column: 'created_at',
                    descending: true,
                },
            ],
        });
        return {
            crons: result.results as CronData[],
            success: true
        };
    } catch (error) {
        console.error(`Error in getEnabledCrons: ${error instanceof Error ? error.message : String(error)}`);
        return {
            crons: [],
            success: false,
            error: `Failed to get enabled crons: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}

/**
 * Get all crons for a specific crew
 * @param orm The D1Orm instance from durable object class
 * @param crewId The ID of the crew to get crons for
 * @returns Promise containing array of crons or error details
 * @throws Error if database query fails
 */
export async function getCronsByCrew(orm: D1Orm, crewId: number): Promise<CronResult> {
    try {
        userCronsModel.SetOrm(orm);
        const result = await userCronsModel.All({
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
            crons: result.results as CronData[],
            success: true
        };
    } catch (error) {
        console.error(`Error in getCronsByCrew: ${error instanceof Error ? error.message : String(error)}`);
        return {
            crons: [],
            success: false,
            error: `Failed to get crons for crew: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}

/**
 * Create a new cron job
 * @param orm The D1Orm instance from durable object class
 * @param cronData The cron configuration data
 * @returns Promise containing the created cron or error details
 * @throws Error if database insertion fails
 */
export async function createCron(orm: D1Orm, cronData: Omit<CronData, 'id' | 'created_at' | 'updated_at' | 'cron_last_run' | 'cron_next_run'>): Promise<CronResult> {
    try {
        userCronsModel.SetOrm(orm);
        const cron = await userCronsModel.InsertOne(cronData);
        return {
            cron: cron as CronData,
            success: true
        };
    } catch (error) {
        console.error(`Error in createCron: ${error instanceof Error ? error.message : String(error)}`);
        return {
            success: false,
            error: `Failed to create cron: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}

/**
 * Update a cron job's input
 * @param orm The D1Orm instance from durable object class
 * @param cronId The ID of the cron to update
 * @param cronInput The new input string for the cron
 * @returns Promise containing the update result or error details
 * @throws Error if database update fails
 */
export async function updateCronInput(orm: D1Orm, cronId: number, cronInput: string): Promise<CronResult> {
    try {
        userCronsModel.SetOrm(orm);
        await userCronsModel.Update({
            where: {
                id: cronId
            },
            data: {
                cron_input: cronInput
            }
        });
        return {
            success: true
        };
    } catch (error) {
        console.error(`Error in updateCronInput: ${error instanceof Error ? error.message : String(error)}`);
        return {
            success: false,
            error: `Failed to update cron input: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}

/**
 * Toggle a cron job's enabled status
 * @param orm The D1Orm instance from durable object class
 * @param cronId The ID of the cron to toggle
 * @param enabled The new enabled status (1 for enabled, 0 for disabled)
 * @returns Promise containing the update result or error details
 * @throws Error if database update fails
 */
export async function toggleCronStatus(orm: D1Orm, cronId: number, enabled: number): Promise<CronResult> {
    try {
        userCronsModel.SetOrm(orm);
        await userCronsModel.Update({
            where: {
                id: cronId
            },
            data: {
                cron_enabled: enabled
            }
        });
        return {
            success: true
        };
    } catch (error) {
        console.error(`Error in toggleCronStatus: ${error instanceof Error ? error.message : String(error)}`);
        return {
            success: false,
            error: `Failed to toggle cron status: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}

interface DetailedCronData {
    crew: any;
    agents: any[];
    tasks: any[];
    profile: any;
}

/**
 * Get all enabled cron jobs with expanded crew information
 * @param orm The D1Orm instance from durable object class
 * @returns Promise containing array of enabled crons with detailed information or error details
 * @throws Error if database query fails
 */
export async function getEnabledCronsDetailed(orm: D1Orm): Promise<{
    details?: DetailedCronData[];
    success: boolean;
    error?: string;
}> {
    try {
        userCronsModel.SetOrm(orm);
        userCrewsModel.SetOrm(orm);
        userAgentsModel.SetOrm(orm);
        userTasksModel.SetOrm(orm);
        userProfilesModel.SetOrm(orm);

        const crons = await userCronsModel.All({
            where: {
                cron_enabled: 1,
            },
            orderBy: [
                {
                    column: 'created_at',
                    descending: true,
                },
            ],
        });

        const details: DetailedCronData[] = [];

        // Iterate through all cron entries returned
        for (const cron of crons.results) {
            // Get the related crew info for this cron
            const crew = await userCrewsModel.First({
                where: {
                    id: cron.crew_id,
                },
            });

            // Get all of the agents for the crew
            const agents = await userAgentsModel.All({
                where: {
                    profile_id: cron.profile_id,
                    crew_id: cron.crew_id,
                },
            });

            // Get all of the tasks for each agent
            const tasks = [];
            for (const agent of agents.results) {
                const agentTasks = await userTasksModel.All({
                    where: {
                        profile_id: cron.profile_id,
                        crew_id: cron.crew_id,
                        agent_id: agent.id,
                    },
                });
                tasks.push(agentTasks.results);
            }

            const profile = await userProfilesModel.First({
                where: {
                    stx_address: cron.profile_id,
                },
            });

            details.push({
                crew,
                agents: agents.results,
                tasks,
                profile,
            });
        }

        return {
            details,
            success: true
        };
    } catch (error) {
        console.error(`Error in getEnabledCronsDetailed: ${error instanceof Error ? error.message : String(error)}`);
        return {
            success: false,
            error: `Failed to get detailed cron information: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}
