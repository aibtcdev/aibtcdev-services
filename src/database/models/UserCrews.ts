import { Model, DataTypes, Infer } from 'd1-orm';
import { toCamelCase, toSnakeCase } from '../../utils/case-transformers';

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

// Original type for ORM operations
export type UserCrewsTable = Infer<typeof userCrewsModel>;

// CamelCase interface for application use
export interface UserCrew {
    id: number;
    createdAt: string;
    updatedAt: string;
    profileId: string;
    crewName: string;
    crewDescription?: string;
    crewExecutions?: number;
    crewIsPublic?: boolean;
    crewIsCron?: boolean;
}

// Transform functions using generic utility
export const transformToCamelCase = (crew: UserCrewsTable): UserCrew => toCamelCase(crew);
export const transformToSnakeCase = (crew: Partial<UserCrew>): Partial<Omit<UserCrewsTable, 'id' | 'created_at' | 'updated_at'>> => 
    toSnakeCase(crew);
