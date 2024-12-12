import { D1Orm } from 'd1-orm';
import { userTasksModel } from '../models';

/** TASK MANAGEMENT */

/**
 * Get a specific task by ID
 */
export async function getTask(orm: D1Orm, taskId: number) {
    userTasksModel.SetOrm(orm);
    const task = await userTasksModel.First({
        where: {
            id: taskId
        }
    });
    return task;
}

/**
 * Get all tasks for a specific agent
 */
export async function getTasks(orm: D1Orm, agentId: number) {
    userTasksModel.SetOrm(orm);
    const tasks = await userTasksModel.All({
        where: {
            agent_id: agentId
        },
        orderBy: [
            {
                column: 'created_at',
                descending: true,
            },
        ],
    });
    return tasks;
}

/**
 * Create a new task
 */
export async function createTask(orm: D1Orm, taskData: {
    profile_id: string;
    crew_id: number;
    agent_id: number;
    task_name: string;
    task_description: string;
    task_expected_output: string;
}) {
    userTasksModel.SetOrm(orm);
    const task = await userTasksModel.InsertOne(taskData);
    return task;
}

/**
 * Update an existing task
 */
export async function updateTask(orm: D1Orm, taskId: number, updates: {
    task_name?: string;
    task_description?: string;
    task_expected_output?: string;
}) {
    userTasksModel.SetOrm(orm);
    const result = await userTasksModel.Update({
        where: {
            id: taskId
        },
        data: updates
    });
    return result;
}

/**
 * Delete a specific task
 */
export async function deleteTask(orm: D1Orm, taskId: number) {
    userTasksModel.SetOrm(orm);
    const result = await userTasksModel.Delete({
        where: {
            id: taskId
        }
    });
    return result;
}

/**
 * Delete all tasks for a specific agent
 */
export async function deleteTasks(orm: D1Orm, agentId: number) {
    userTasksModel.SetOrm(orm);
    const result = await userTasksModel.Delete({
        where: {
            agent_id: agentId
        }
    });
    return result;
}
