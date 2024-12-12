import { D1Orm } from 'd1-orm';
import { userAgentsModel, userCrewsModel, userCronsModel, userProfilesModel, userTasksModel } from '../models';

/** CRON MANAGEMENT */

/**
 * Get all enabled cron jobs
 * @param orm The D1Orm instance
 * @returns Promise containing array of enabled crons and metadata
 */
export async function getEnabledCrons(orm: D1Orm): Promise<{results: any[]}> {
    try {
	userCronsModel.SetOrm(orm);
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
        return crons;
    } catch (error) {
        console.error(`Error in getEnabledCrons: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    }
}

/**
 * Get all crons for a specific crew
 * @param orm The D1Orm instance
 * @param crewId The ID of the crew to get crons for
 * @returns Promise containing array of crons and metadata
 */
export async function getCronsByCrew(orm: D1Orm, crewId: number): Promise<{results: any[]}> {
    try {
    userCronsModel.SetOrm(orm);
    const crons = await userCronsModel.All({
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
        return crons;
    } catch (error) {
        console.error(`Error in getCronsByCrew: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    }
}

/**
 * Create a new cron job
 * @param orm The D1Orm instance
 * @param cronData The cron configuration data
 * @returns Promise containing the created cron
 */
export async function createCron(orm: D1Orm, cronData: {
    profile_id: string;
    crew_id: number;
    cron_enabled: number;
    cron_interval: string;
    cron_input: string;
}) {
    userCronsModel.SetOrm(orm);
    const cron = await userCronsModel.InsertOne(cronData);
        return cron;
    } catch (error) {
        console.error(`Error in createCron: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    }
}

/**
 * Update a cron job's input
 * @param orm The D1Orm instance
 * @param cronId The ID of the cron to update
 * @param cronInput The new input string for the cron
 * @returns Promise containing the update result
 */
export async function updateCronInput(orm: D1Orm, cronId: number, cronInput: string): Promise<any> {
    try {
    userCronsModel.SetOrm(orm);
    const result = await userCronsModel.Update({
        where: {
            id: cronId
        },
        data: {
            cron_input: cronInput
        }
    });
        return result;
    } catch (error) {
        console.error(`Error in updateCronInput: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    }
}

/**
 * Toggle a cron job's enabled status
 * @param orm The D1Orm instance
 * @param cronId The ID of the cron to toggle
 * @param enabled The new enabled status (1 for enabled, 0 for disabled)
 * @returns Promise containing the update result
 */
export async function toggleCronStatus(orm: D1Orm, cronId: number, enabled: number): Promise<any> {
    try {
    userCronsModel.SetOrm(orm);
    const result = await userCronsModel.Update({
        where: {
            id: cronId
        },
        data: {
            cron_enabled: enabled
        }
    });
        return result;
    } catch (error) {
        console.error(`Error in toggleCronStatus: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    }
}

/**
 * Get all enabled cron jobs with expanded crew information
 * @param orm The D1Orm instance
 * @returns Promise containing array of enabled crons with detailed crew, agent, task, and profile information
 */
export async function getEnabledCronsDetailed(orm: D1Orm): Promise<any[]> {
    try {
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

	const result = [];

	// iterate through all cron entries returned
	for (const cron of crons.results) {
		// get the related crew info for this cron
		const crew = await userCrewsModel.First({
			where: {
				id: cron.crew_id,
			},
		});
		// get all of the agents for the crew
		const agents = await userAgentsModel.All({
			where: {
				profile_id: cron.profile_id,
				crew_id: cron.crew_id,
			},
		});
		// get all of the tasks for each agent
		let tasks = [];
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
		const profile = userProfilesModel.First({
			where: {
				stx_address: cron.profile_id,
			},
		});

		result.push({
			crew,
			agents,
			tasks,
			profile,
		});
	}

        return result;
    } catch (error) {
        console.error(`Error in getEnabledCronsDetailed: ${error instanceof Error ? error.message : String(error)}`);
        throw error;
    }
}
