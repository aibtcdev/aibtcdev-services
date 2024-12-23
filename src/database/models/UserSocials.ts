import { Model, DataTypes, Infer } from 'd1-orm';
import { toCamelCase, toSnakeCase } from '../../utils/case-transformers';

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

// Transform functions using generic utility
export const transformToCamelCase = (social: UserSocialsTable): UserSocial => toCamelCase(social);
export const transformToSnakeCase = (social: Partial<UserSocial>): Partial<Omit<UserSocialsTable, 'id' | 'created_at' | 'updated_at'>> => 
    toSnakeCase(social);
