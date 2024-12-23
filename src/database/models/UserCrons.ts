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

// Original type for ORM operations
export type UserCronsTable = Infer<typeof userCronsModel>;

// CamelCase interface for application use
export interface UserCron {
    id: number;
    createdAt: string;
    updatedAt: string;
    profileId: string;
    crewId: number;
    cronEnabled: boolean;
    cronInterval: string;
    cronInput: string;
}

// Transform functions with explicit mapping
export const transformUserCronToCamelCase = (cron: UserCronsTable): UserCron => ({
    id: cron.id,
    createdAt: cron.created_at || '',
    updatedAt: cron.updated_at || '',
    profileId: cron.profile_id,
    crewId: cron.crew_id,
    cronEnabled: Boolean(cron.cron_enabled),
    cronInterval: cron.cron_interval,
    cronInput: cron.cron_input
});

export const transformUserCronToSnakeCase = (cron: Partial<UserCron>): Partial<Omit<UserCronsTable, 'id' | 'created_at' | 'updated_at'>> => ({
    profile_id: cron.profileId,
    crew_id: cron.crewId,
    cron_enabled: cron.cronEnabled ? 1 : 0,
    cron_interval: cron.cronInterval,
    cron_input: cron.cronInput
});
