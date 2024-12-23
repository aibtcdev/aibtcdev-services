import { Model, DataTypes, Infer } from 'd1-orm';
import { toCamelCase, toSnakeCase } from '../../utils/case-transformers';

export const userCrewExecutionStepsModel = new Model(
	{
		D1Orm: undefined,
		tableName: 'user_crew_execution_steps',
		primaryKeys: 'id',
		autoIncrement: 'id',
	},
	{
		id: { type: DataTypes.INTEGER, notNull: true },
		created_at: { type: DataTypes.STRING },
		updated_at: { type: DataTypes.STRING },
		profile_id: { type: DataTypes.STRING, notNull: true },
		crew_id: { type: DataTypes.INTEGER, notNull: true },
		execution_id: { type: DataTypes.INTEGER, notNull: true },
		step_type: { type: DataTypes.STRING, notNull: true },
		step_data: { type: DataTypes.STRING, notNull: true },
	}
);

// Original type for ORM operations
export type UserCrewExecutionStepsTable = Infer<typeof userCrewExecutionStepsModel>;

// CamelCase interface for application use
export interface UserCrewExecutionStep {
	id: number;
	createdAt: string;
	updatedAt: string;
	profileId: string;
	crewId: number;
	executionId: number;
	stepType: string;
	stepData: string;
}

// Transform functions with explicit mapping
export const transformUserCrewExecutionStepToCamelCase = (step: UserCrewExecutionStepsTable): UserCrewExecutionStep => ({
    id: step.id,
    createdAt: step.created_at || '',
    updatedAt: step.updated_at || '',
    profileId: step.profile_id,
    crewId: step.crew_id,
    executionId: step.execution_id,
    stepType: step.step_type,
    stepData: step.step_data
});

export const transformUserCrewExecutionStepToSnakeCase = (step: Partial<UserCrewExecutionStep>): Partial<Omit<UserCrewExecutionStepsTable, 'id' | 'created_at' | 'updated_at'>> => ({
    profile_id: step.profileId,
    crew_id: step.crewId,
    execution_id: step.executionId,
    step_type: step.stepType,
    step_data: step.stepData
});
