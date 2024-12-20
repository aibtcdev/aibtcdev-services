import { Handler } from './types';
import { createApiResponse } from '../../utils/requests-responses';
import { validateSessionToken } from '../../utils/auth-helper';
import { 
    getTask,
    getTasks,
    createTask,
    updateTask,
    deleteTask,
    deleteTasks
} from '../helpers/tasks';
import { UserTasksTable } from '../models';

export const handleTasks: Handler = async ({ orm, env, request, url }) => {
    const endpoint = url.pathname.split('/').pop();

    switch (endpoint) {
        case 'get': {
            const taskId = url.searchParams.get('id');
            if (!taskId) {
                return createApiResponse('Missing id parameter', 400);
            }
            const task = await getTask(orm, parseInt(taskId));
            return createApiResponse({
                message: 'Successfully retrieved task',
                data: { task },
            });
        }

        case 'list': {
            const agentId = url.searchParams.get('agentId');
            if (!agentId) {
                return createApiResponse('Missing agentId parameter', 400);
            }
            const tasks = await getTasks(orm, parseInt(agentId));
            return createApiResponse({
                message: 'Successfully retrieved tasks',
                data: { tasks },
            });
        }

        case 'create': {
            if (request.method !== 'POST') {
                return createApiResponse('Method not allowed', 405);
            }
            const taskData = (await request.json()) as UserTasksTable;
            if (
                !taskData.profile_id ||
                !taskData.crew_id ||
                !taskData.agent_id ||
                !taskData.task_name ||
                !taskData.task_description ||
                !taskData.task_expected_output
            ) {
                return createApiResponse(
                    'Missing required fields: profile_id, crew_id, agent_id, task_name, task_description, task_expected_output',
                    400
                );
            }
            const task = await createTask(orm, taskData);
            return createApiResponse({
                message: 'Successfully created task',
                data: { task },
            });
        }

        case 'update': {
            if (request.method !== 'PUT') {
                return createApiResponse('Method not allowed', 405);
            }
            const taskId = url.searchParams.get('id');
            if (!taskId) {
                return createApiResponse('Missing id parameter', 400);
            }
            const updates = (await request.json()) as Partial<
                Omit<UserTasksTable, 'id' | 'created_at' | 'updated_at' | 'profile_id' | 'crew_id' | 'agent_id'>
            >;
            const result = await updateTask(orm, parseInt(taskId), updates);
            return createApiResponse({
                message: 'Successfully updated task',
                data: { result },
            });
        }

        case 'delete': {
            if (request.method !== 'DELETE') {
                return createApiResponse('Method not allowed', 405);
            }
            const taskId = url.searchParams.get('id');
            if (!taskId) {
                return createApiResponse('Missing id parameter', 400);
            }
            const result = await deleteTask(orm, parseInt(taskId));
            return createApiResponse({
                message: 'Successfully deleted task',
                data: { result },
            });
        }

        case 'delete-all': {
            if (request.method !== 'DELETE') {
                return createApiResponse('Method not allowed', 405);
            }
            const agentId = url.searchParams.get('agentId');
            if (!agentId) {
                return createApiResponse('Missing agentId parameter', 400);
            }
            const result = await deleteTasks(orm, parseInt(agentId));
            return createApiResponse({
                message: 'Successfully deleted all tasks for agent',
                data: { result },
            });
        }

        default:
            return createApiResponse(`Unsupported tasks endpoint: ${endpoint}`, 404);
    }
};
