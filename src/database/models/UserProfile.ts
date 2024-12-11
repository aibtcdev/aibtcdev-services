import { Model, DataTypes, Infer } from 'd1-orm';

export const userProfilesModel = new Model(
	{
		D1Orm: undefined,
		tableName: 'user_profiles',
		primaryKeys: 'id',
		autoIncrement: 'id',
		uniqueKeys: [['stx_address']],
	},
	{
		id: { type: DataTypes.INTEGER, notNull: true },
		created_at: { type: DataTypes.STRING },
		updated_at: { type: DataTypes.STRING },
		user_role: { type: DataTypes.STRING, notNull: true },
		account_index: { type: DataTypes.INTEGER },
		stx_address: { type: DataTypes.STRING, notNull: true },
		bns_address: { type: DataTypes.STRING },
	}
);

export type UserProfilesTable = Infer<typeof userProfilesModel>;
