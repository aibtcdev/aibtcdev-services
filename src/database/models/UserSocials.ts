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

// Original type for ORM operations
export type UserSocialsTable = Infer<typeof userSocialsModel>;

// CamelCase interface for application use
export interface UserSocial {
	id: number;
	createdAt: string;
	updatedAt: string;
	profileId: string;
	platform: string;
	platformId: string;
}

// Transform functions with explicit mapping
export const transformUserSocialToCamelCase = (social: UserSocialsTable): UserSocial => ({
	id: social.id,
	createdAt: social.created_at || '',
	updatedAt: social.updated_at || '',
	profileId: social.profile_id,
	platform: social.platform,
	platformId: social.platform_id,
});

export const transformUserSocialToSnakeCase = (
	social: Partial<UserSocial>
): Partial<Omit<UserSocialsTable, 'id' | 'created_at' | 'updated_at'>> => ({
	profile_id: social.profileId,
	platform: social.platform,
	platform_id: social.platformId,
});
