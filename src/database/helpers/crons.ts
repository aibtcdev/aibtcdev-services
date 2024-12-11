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
