import { Model, DataTypes, Infer } from 'd1-orm';

const schema = {
	id: { type: DataTypes.INTEGER, notNull: true },
	created_at: { type: DataTypes.STRING },
	updated_at: { type: DataTypes.STRING },
	profile_id: { type: DataTypes.STRING, notNull: true },
	crew_id: { type: DataTypes.INTEGER, notNull: true },
	conversation_id: { type: DataTypes.INTEGER, notNull: true },
	user_input: { type: DataTypes.STRING },
	final_result: { type: DataTypes.STRING },
	total_tokens: { type: DataTypes.INTEGER },
	successful_requests: { type: DataTypes.INTEGER },
};

export const userCrewsExecutionsModel = new Model(
	{
		D1Orm: undefined,
		tableName: 'user_crew_executions',
		primaryKeys: 'id',
		autoIncrement: 'id',
	},
	schema
);

export type UserCrewsExecutionsTable = Infer<typeof userCrewsExecutionsModel>;
