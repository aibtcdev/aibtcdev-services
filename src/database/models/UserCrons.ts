import { Model, DataTypes, Infer } from 'd1-orm';

export const userCronsModel = new Model(
	{
		D1Orm: undefined,
		tableName: 'user_crons',
		primaryKeys: 'id',
		autoIncrement: 'id',
	},
	{
		id: { type: DataTypes.INTEGER, notNull: true },
		created_at: { type: DataTypes.STRING },
		updated_at: { type: DataTypes.STRING },
		profile_id: { type: DataTypes.STRING, notNull: true },
		crew_id: { type: DataTypes.INTEGER, notNull: true },
		cron_enabled: { type: DataTypes.BOOLEAN, notNull: true },
		cron_interval: { type: DataTypes.STRING, notNull: true },
		cron_input: { type: DataTypes.STRING, notNull: true },
	}
);

export type UserCronsTable = Infer<typeof userCronsModel>;
