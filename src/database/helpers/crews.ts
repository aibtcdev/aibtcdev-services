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
