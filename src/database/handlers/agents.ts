import { HandlerDefinition } from './types';
import { createApiResponse } from '../../utils/requests-responses';
import { validateSessionToken } from '../../utils/auth-helper';
import { getAgents, createAgent, updateAgent, deleteAgent } from '../helpers/agents';
import { UserAgentsTable } from '../models';

export const agentsHandler: HandlerDefinition = {
	baseRoute: 'agents',
	endpoints: [
		{
			path: '/agents/get',
			methods: ['GET'],
			description: 'Get all agents for a crew',
			requiresAuth: true,
			parameters: {
				crewId: 'ID of the crew to get agents for'
			}
		},
		{
			path: '/agents/create',
			methods: ['POST'],
			description: 'Create a new agent',
			requiresAuth: true,
			requestBody: {
				profile_id: 'STX address of the user',
				crew_id: 'ID of the crew',
				agent_name: 'Name of the agent',
				agent_role: 'Role of the agent',
				agent_goal: 'Goal of the agent',
				agent_backstory: 'Backstory of the agent'
			}
		},
		{
			path: '/agents/update',
			methods: ['PUT'],
			description: 'Update an existing agent',
			requiresAuth: true,
			parameters: {
				id: 'ID of the agent to update'
			},
			requestBody: {
				agent_name: 'Optional: New name of the agent',
				agent_role: 'Optional: New role of the agent',
				agent_goal: 'Optional: New goal of the agent',
				agent_backstory: 'Optional: New backstory of the agent'
			}
		},
		{
			path: '/agents/delete',
			methods: ['DELETE'],
			description: 'Delete an agent',
			requiresAuth: true,
			parameters: {
				id: 'ID of the agent to delete'
			}
		},
	],
	handler: async ({ orm, env, request, url }) => {
		// Verify authentication for all endpoints
		const authHeader = request.headers.get('Authorization');
		if (!authHeader) {
			return createApiResponse('Missing authorization header', 401);
		}
		const token = authHeader.replace('Bearer ', '');
		const tokenAddress = await validateSessionToken(env, token);
		if (!tokenAddress.success) {
			return createApiResponse('Unauthorized access', 403);
		}

		const endpoint = url.pathname.split('/').pop();
		switch (endpoint) {
			case 'get': {
				const crewId = url.searchParams.get('crewId');
				if (!crewId) {
					return createApiResponse('Missing crewId parameter', 400);
				}
				const agents = await getAgents(orm, parseInt(crewId));
				return createApiResponse({
					message: 'Successfully retrieved agents',
					data: { agents },
				});
			}

			case 'create': {
				if (request.method !== 'POST') {
					return createApiResponse('Method not allowed', 405);
				}
				const agentData = (await request.json()) as Omit<UserAgentsTable, 'id' | 'created_at' | 'updated_at'>;
				if (
					!agentData.profile_id ||
					!agentData.crew_id ||
					!agentData.agent_name ||
					!agentData.agent_role ||
					!agentData.agent_goal ||
					!agentData.agent_backstory
				) {
					return createApiResponse(
						'Missing required fields: profile_id, crew_id, agent_name, agent_role, agent_goal, agent_backstory',
						400
					);
				}
				const agent = await createAgent(orm, agentData);
				return createApiResponse({
					message: 'Successfully created agent',
					data: { agent },
				});
			}

			case 'update': {
				if (request.method !== 'PUT') {
					return createApiResponse('Method not allowed', 405);
				}
				const agentId = url.searchParams.get('id');
				if (!agentId) {
					return createApiResponse('Missing id parameter', 400);
				}
				const updates = (await request.json()) as Partial<
					Omit<UserAgentsTable, 'id' | 'created_at' | 'updated_at' | 'profile_id' | 'crew_id'>
				>;
				const result = await updateAgent(orm, parseInt(agentId), updates);
				return createApiResponse({
					message: 'Successfully updated agent',
					data: { result },
				});
			}

			case 'delete': {
				if (request.method !== 'DELETE') {
					return createApiResponse('Method not allowed', 405);
				}
				const agentId = url.searchParams.get('id');
				if (!agentId) {
					return createApiResponse('Missing id parameter', 400);
				}
				const result = await deleteAgent(orm, parseInt(agentId));
				return createApiResponse({
					message: 'Successfully deleted agent',
					data: { result },
				});
			}

			default:
				return createApiResponse(`Unsupported agents endpoint: ${endpoint}`, 404);
		}
	},
};
