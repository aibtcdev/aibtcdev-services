import { D1Orm } from 'd1-orm';
import { userAgentsModel, userCrewsModel, userCronsModel, userProfilesModel, userTasksModel } from '../models';

/** CRON MANAGEMENT */

/**
 * Get all enabled cron jobs.
 * @param orm The orm instance from durable object class
 */
export async function getEnabledCrons(orm: D1Orm) {
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
}

/**
 * Get all enabled cron jobs with expanded crew information.
 * @param orm The orm instance from durable object class
 */
/**
 * Get all crons for a specific crew
 */
export async function getCronsByCrew(orm: D1Orm, crewId: number) {
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
}

/**
 * Create a new cron job
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
}

/**
 * Update a cron job's input
 */
export async function updateCronInput(orm: D1Orm, cronId: number, cronInput: string) {
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
}

/**
 * Toggle a cron job's enabled status
 */
export async function toggleCronStatus(orm: D1Orm, cronId: number, enabled: number) {
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
}

export async function getEnabledCronsDetailed(orm: D1Orm) {
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
}
