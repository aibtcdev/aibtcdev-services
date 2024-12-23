import { Model, DataTypes, Infer } from 'd1-orm';
import { toCamelCase, toSnakeCase } from '../../utils/case-transformers';

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

// Transform functions using generic utility
export const transformToCamelCase = (task: UserTasksTable): UserTask => toCamelCase(task);
export const transformToSnakeCase = (task: Partial<UserTask>): Partial<Omit<UserTasksTable, 'id' | 'created_at' | 'updated_at'>> => 
    toSnakeCase(task);
