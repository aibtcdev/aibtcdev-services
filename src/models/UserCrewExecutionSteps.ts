import { Model, DataTypes, Infer } from 'd1-orm';

const schema = {
	id: { type: DataTypes.INTEGER, notNull: true },
	created_at: { type: DataTypes.STRING },
	crew_id: { type: DataTypes.INTEGER, notNull: true },
	execution_id: { type: DataTypes.INTEGER, notNull: true },
	step_type: { type: DataTypes.STRING, notNull: true },
	step_data: { type: DataTypes.STRING, notNull: true },
};

export const userCrewExecutionStepsModel = new Model(
	{
		D1Orm: undefined,
		tableName: 'user_crew_execution_steps',
		primaryKeys: 'id',
		autoIncrement: 'id',
	},
	schema
);

export type UserCrewExecutionStepsTable = Infer<typeof userCrewExecutionStepsModel>;
