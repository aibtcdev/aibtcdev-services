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

// Original type for ORM operations
export type UserProfilesTable = Infer<typeof userProfilesModel>;

// CamelCase interface for application use
export interface UserProfile {
	id: number;
	createdAt: string;
	updatedAt: string;
	userRole: string;
	accountIndex?: number;
	stxAddress: string;
	bnsAddress?: string;
}

// Transform functions with explicit mapping
export const transformUserProfileToCamelCase = (profile: UserProfilesTable): UserProfile => ({
	id: profile.id,
	createdAt: profile.created_at || '',
	updatedAt: profile.updated_at || '',
	userRole: profile.user_role,
	accountIndex: profile.account_index ?? undefined,
	stxAddress: profile.stx_address,
	bnsAddress: profile.bns_address ?? undefined,
});

export const transformUserProfileToSnakeCase = (
	profile: Partial<UserProfile>
): Partial<Omit<UserProfilesTable, 'id' | 'created_at' | 'updated_at'>> => ({
	user_role: profile.userRole,
	account_index: profile.accountIndex,
	stx_address: profile.stxAddress,
	bns_address: profile.bnsAddress,
});
