import { D1Orm } from 'd1-orm';
import { userTasksModel, UserTasksTable } from '../models';

/** TASK MANAGEMENT */

interface TaskResult {
    task?: UserTasksTable;
    tasks?: UserTasksTable[];
    success: boolean;
    error?: string;
}

/**
 * Get a specific task by ID
 * @param orm The D1Orm instance from durable object class
 * @param taskId The ID of the task to retrieve
 * @returns Promise containing the task data or error details
 * @throws Error if database query fails
 */
export async function getTask(orm: D1Orm, taskId: number): Promise<TaskResult> {
    try {
        userTasksModel.SetOrm(orm);
        const task = await userTasksModel.First({
            where: {
                id: taskId
            }
        });
        return {
            task: task as unknown as UserTasksTable,
            success: true
        };
    } catch (error) {
        console.error(`Error in getTask: ${error instanceof Error ? error.message : String(error)}`);
        return {
            success: false,
            error: `Failed to get task: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}

/**
 * Get all tasks for a specific agent
 * @param orm The D1Orm instance from durable object class
 * @param agentId The ID of the agent to get tasks for
 * @returns Promise containing array of tasks or error details
 * @throws Error if database query fails
 */
export async function getTasks(orm: D1Orm, agentId: number): Promise<TaskResult> {
    try {
        userTasksModel.SetOrm(orm);
        const result = await userTasksModel.All({
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
        return {
            tasks: result.results as unknown as UserTasksTable[],
            success: true
        };
    } catch (error) {
        console.error(`Error in getTasks: ${error instanceof Error ? error.message : String(error)}`);
        return {
            tasks: [],
            success: false,
            error: `Failed to get tasks: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}

/**
 * Create a new task
 * @param orm The D1Orm instance from durable object class
 * @param taskData The task configuration data
 * @returns Promise containing the created task or error details
 * @throws Error if database insertion fails
 */
export async function createTask(orm: D1Orm, taskData: Omit<UserTasksTable, 'id' | 'created_at' | 'updated_at'>): Promise<TaskResult> {
    try {
        userTasksModel.SetOrm(orm);
        const task = await userTasksModel.InsertOne(taskData);
        return {
            task: task as unknown as UserTasksTable,
            success: true
        };
    } catch (error) {
        console.error(`Error in createTask: ${error instanceof Error ? error.message : String(error)}`);
        return {
            success: false,
            error: `Failed to create task: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}

/**
 * Update an existing task
 * @param orm The D1Orm instance from durable object class
 * @param taskId The ID of the task to update
 * @param updates The fields to update on the task
 * @returns Promise containing the update result or error details
 * @throws Error if database update fails
 */
export async function updateTask(orm: D1Orm, taskId: number, updates: Partial<Pick<UserTasksTable, 'task_name' | 'task_description' | 'task_expected_output'>>): Promise<TaskResult> {
    try {
        userTasksModel.SetOrm(orm);
        await userTasksModel.Update({
            where: {
                id: taskId
            },
            data: updates
        });
        return {
            success: true
        };
    } catch (error) {
        console.error(`Error in updateTask: ${error instanceof Error ? error.message : String(error)}`);
        return {
            success: false,
            error: `Failed to update task: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}

/**
 * Delete a specific task
 * @param orm The D1Orm instance from durable object class
 * @param taskId The ID of the task to delete
 * @returns Promise containing the deletion result or error details
 * @throws Error if database deletion fails
 */
export async function deleteTask(orm: D1Orm, taskId: number): Promise<TaskResult> {
    try {
        userTasksModel.SetOrm(orm);
        await userTasksModel.Delete({
            where: {
                id: taskId
            }
        });
        return {
            success: true
        };
    } catch (error) {
        console.error(`Error in deleteTask: ${error instanceof Error ? error.message : String(error)}`);
        return {
            success: false,
            error: `Failed to delete task: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}

/**
 * Delete all tasks for a specific agent
 * @param orm The D1Orm instance from durable object class
 * @param agentId The ID of the agent whose tasks should be deleted
 * @returns Promise containing the deletion result or error details
 * @throws Error if database deletion fails
 */
export async function deleteTasks(orm: D1Orm, agentId: number): Promise<TaskResult> {
    try {
        userTasksModel.SetOrm(orm);
        await userTasksModel.Delete({
            where: {
                agent_id: agentId
            }
        });
        return {
            success: true
        };
    } catch (error) {
        console.error(`Error in deleteTasks: ${error instanceof Error ? error.message : String(error)}`);
        return {
            success: false,
            error: `Failed to delete tasks: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}
