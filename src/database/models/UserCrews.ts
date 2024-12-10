import { Model, DataTypes, Infer } from 'd1-orm';

export const userCrewsModel = new Model(
	{
		D1Orm: undefined,
		tableName: 'user_crews',
		primaryKeys: 'id',
		autoIncrement: 'id',
	},
	{
		id: { type: DataTypes.INTEGER, notNull: true },
		created_at: { type: DataTypes.STRING },
		updated_at: { type: DataTypes.STRING },
		profile_id: { type: DataTypes.STRING, notNull: true },
		crew_name: { type: DataTypes.STRING, notNull: true },
		crew_description: { type: DataTypes.STRING },
		crew_executions: { type: DataTypes.INTEGER },
		crew_is_public: { type: DataTypes.BOOLEAN },
		crew_is_cron: { type: DataTypes.BOOLEAN },
	}
);

export type UserCrewsTable = Infer<typeof userCrewsModel>;
