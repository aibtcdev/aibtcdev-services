import { Model, DataTypes, Infer } from 'd1-orm';

export const userTasksModel = new Model(
	{
		D1Orm: undefined,
		tableName: 'user_tasks',
		primaryKeys: 'id',
		autoIncrement: 'id',
	},
	{
		id: { type: DataTypes.INTEGER, notNull: true },
		created_at: { type: DataTypes.STRING },
		updated_at: { type: DataTypes.STRING },
		profile_id: { type: DataTypes.STRING, notNull: true },
		crew_id: { type: DataTypes.INTEGER, notNull: true },
		agent_id: { type: DataTypes.INTEGER, notNull: true },
		task_name: { type: DataTypes.STRING, notNull: true },
		task_description: { type: DataTypes.STRING, notNull: true },
		task_expected_output: { type: DataTypes.STRING, notNull: true },
	}
);

// Original type for ORM operations
export type UserTasksTable = Infer<typeof userTasksModel>;

// CamelCase interface for application use
export interface UserTask {
	id: number;
	createdAt: string;
	updatedAt: string;
	profileId: string;
	crewId: number;
	agentId: number;
	taskName: string;
	taskDescription: string;
	taskExpectedOutput: string;
}

// Transform functions with explicit mapping
export const transformUserTaskToCamelCase = (task: UserTasksTable): UserTask => ({
	id: task.id,
	createdAt: task.created_at || '',
	updatedAt: task.updated_at || '',
	profileId: task.profile_id,
	crewId: task.crew_id,
	agentId: task.agent_id,
	taskName: task.task_name,
	taskDescription: task.task_description,
	taskExpectedOutput: task.task_expected_output,
});

export const transformUserTaskToSnakeCase = (
	task: Partial<UserTask>
): Partial<Omit<UserTasksTable, 'id' | 'created_at' | 'updated_at'>> => ({
	profile_id: task.profileId,
	crew_id: task.crewId,
	agent_id: task.agentId,
	task_name: task.taskName,
	task_description: task.taskDescription,
	task_expected_output: task.taskExpectedOutput,
});
