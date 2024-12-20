import { Handler } from './types';
import { createApiResponse } from '../../utils/requests-responses';
import { validateSessionToken } from '../../utils/auth-helper';
import { 
    getAgents,
    createAgent,
    updateAgent,
    deleteAgent
} from '../helpers/agents';
import { UserAgentsTable } from '../models';

export const handleAgents: Handler = async ({ orm, env, request, url }) => {
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
};
