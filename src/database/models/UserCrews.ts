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

// Transform functions with explicit mapping
export const transformUserCrewToCamelCase = (crew: UserCrewsTable): UserCrew => ({
	id: crew.id,
	createdAt: crew.created_at || '',
	updatedAt: crew.updated_at || '',
	profileId: crew.profile_id,
	crewName: crew.crew_name,
	crewDescription: crew.crew_description ?? undefined,
	crewExecutions: crew.crew_executions ?? undefined,
	crewIsPublic: crew.crew_is_public ?? undefined,
	crewIsCron: crew.crew_is_cron ?? undefined,
});

export const transformUserCrewToSnakeCase = (
	crew: Partial<UserCrew>
): Partial<Omit<UserCrewsTable, 'id' | 'created_at' | 'updated_at'>> => ({
	profile_id: crew.profileId,
	crew_name: crew.crewName,
	crew_description: crew.crewDescription,
	crew_executions: crew.crewExecutions,
	crew_is_public: crew.crewIsPublic ?? undefined,
	crew_is_cron: crew.crewIsCron ?? undefined,
});
