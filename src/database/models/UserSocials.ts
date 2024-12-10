import { Model, DataTypes, Infer } from 'd1-orm';

export const userSocialsModel = new Model(
	{
		D1Orm: undefined,
		tableName: 'user_socials',
		primaryKeys: 'id',
		autoIncrement: 'id',
	},
	{
		id: { type: DataTypes.INTEGER, notNull: true },
		created_at: { type: DataTypes.STRING },
		updated_at: { type: DataTypes.STRING },
		profile_id: { type: DataTypes.STRING, notNull: true },
		platform: { type: DataTypes.STRING, notNull: true },
		platform_id: { type: DataTypes.STRING, notNull: true },
	}
);

export type UserSocialsTable = Infer<typeof userSocialsModel>;
