import { D1Orm } from 'd1-orm';
import { userCrewExecutionsModel, userCrewsModel } from '../models';

/** CREW MANAGEMENT */

/**
 * Create a new crew run for a profile. _(previously: "job")_
 * @param orm The orm instance from durable object class
 * @param address The Stacks address for the user's profile
 * @param crewId The ID of the crew being executed
 * @param conversationId The ID of the conversation this execution belongs to
 * @param input Optional user input for the execution
 */
export async function addCrewExecution(orm: D1Orm, address: string, crewId: number, conversationId: number, input?: string) {
	userCrewExecutionsModel.SetOrm(orm);
	const execution = await userCrewExecutionsModel.InsertOne({
		profile_id: address,
		crew_id: crewId,
		conversation_id: conversationId,
		user_input: input,
		total_tokens: 0,
		successful_requests: 0,
	});
	return execution;
}

/**
 * Get all executed crew runs for a profile. _(previously: "job")_
 * @param orm The orm instance from durable object class
 * @param address The Stacks address for the user's profile
 */
export async function getCrewExecutions(orm: D1Orm, address: string) {
	userCrewExecutionsModel.SetOrm(orm);
	const executions = await userCrewExecutionsModel.All({
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
	return executions;
}

/**
 * Get all public crew configurations.
 * @param orm The orm instance from durable object class
 */
export async function getPublicCrews(orm: D1Orm) {
	userCrewsModel.SetOrm(orm);
	const crews = await userCrewsModel.All({
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
	return crews;
}

/**
 * Get a specific crew by ID
 */
export async function getCrew(orm: D1Orm, crewId: number) {
    userCrewsModel.SetOrm(orm);
    const crew = await userCrewsModel.First({
        where: {
            id: crewId
        }
    });
    return crew;
}

/**
 * Create a new crew
 */
export async function createCrew(orm: D1Orm, crewData: {
    profile_id: string;
    crew_name: string;
    crew_description?: string;
    crew_is_public?: number;
}) {
    userCrewsModel.SetOrm(orm);
    const crew = await userCrewsModel.InsertOne(crewData);
    return crew;
}

/**
 * Update an existing crew
 */
export async function updateCrew(orm: D1Orm, crewId: number, updates: {
    crew_name?: string;
    crew_description?: string;
    crew_is_public?: number;
}) {
    userCrewsModel.SetOrm(orm);
    const result = await userCrewsModel.Update({
        where: {
            id: crewId
        },
        data: updates
    });
    return result;
}

/**
 * Delete a crew and all associated data
 */
export async function deleteCrew(orm: D1Orm, crewId: number) {
    // Due to CASCADE DELETE in schema, deleting the crew will automatically delete:
    // - Associated agents (user_agents)
    // - Associated tasks (user_tasks) 
    // - Associated executions (user_crew_executions)
    // - Associated execution steps (user_crew_execution_steps)
    // - Associated crons (user_crons)
    userCrewsModel.SetOrm(orm);
    const result = await userCrewsModel.Delete({
        where: {
            id: crewId
        }
    });
    return result;
}
