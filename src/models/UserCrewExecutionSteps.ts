import { Model, DataTypes, type Infer } from 'd1-orm';
import { getOrm } from './orm-config';
import type { Env } from '../../worker-configuration';

const schema = {
    id: { type: DataTypes.INTEGER, notNull: true },
    created_at: { type: DataTypes.STRING },
    crew_id: { type: DataTypes.INTEGER, notNull: true },
    execution_id: { type: DataTypes.INTEGER, notNull: true },
    step_type: { type: DataTypes.STRING, notNull: true },
    step_data: { type: DataTypes.STRING, notNull: true }
};

const schemaType = { columns: schema };

export type IUserCrewExecutionSteps = Infer<typeof schemaType>;

export function getUserCrewExecutionStepsModel(env: Env) {
    return new Model(
        {
            D1Orm: getOrm(env),
            tableName: 'user_crew_execution_steps',
            primaryKeys: 'id',
            autoIncrement: 'id',
        },
        schema
    );
}
