import { Model, DataTypes, Infer } from 'd1-orm';

const schema = {
	id: { type: DataTypes.INTEGER, notNull: true },
	created_at: { type: DataTypes.STRING },
	updated_at: { type: DataTypes.STRING },
	profile_id: { type: DataTypes.STRING, notNull: true },
	crew_id: { type: DataTypes.INTEGER, notNull: true },
	agent_id: { type: DataTypes.INTEGER, notNull: true },
	task_name: { type: DataTypes.STRING, notNull: true },
	task_description: { type: DataTypes.STRING, notNull: true },
	task_expected_output: { type: DataTypes.STRING, notNull: true },
};

export const userTasksModel = new Model(
	{
		D1Orm: undefined,
		tableName: 'user_tasks',
		primaryKeys: 'id',
		autoIncrement: 'id',
	},
	schema
);

export type UserTasksTable = Infer<typeof userTasksModel>;
