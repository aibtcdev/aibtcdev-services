import { Model, DataTypes, Infer } from 'd1-orm';

const schema = {
	id: { type: DataTypes.INTEGER, notNull: true },
	created_at: { type: DataTypes.STRING },
	updated_at: { type: DataTypes.STRING },
	profile_id: { type: DataTypes.STRING, notNull: true },
	crew_name: { type: DataTypes.STRING, notNull: true },
	crew_description: { type: DataTypes.STRING },
	crew_executions: { type: DataTypes.INTEGER },
	crew_is_public: { type: DataTypes.INTEGER },
};

export const userCrewsModel = new Model(
	{
		D1Orm: undefined,
		tableName: 'user_crews',
		primaryKeys: 'id',
		autoIncrement: 'id',
	},
	schema
);

export type UserCrewsTable = Infer<typeof userCrewsModel>;
