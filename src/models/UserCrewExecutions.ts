import { Model, DataTypes, type Infer } from 'd1-orm';
import { getOrm } from './orm-config';
import type { Env } from '../../worker-configuration';

const schema = {
    id: { type: DataTypes.INTEGER, notNull: true },
    created_at: { type: DataTypes.STRING },
    updated_at: { type: DataTypes.STRING },
    profile_id: { type: DataTypes.STRING, notNull: true },
    crew_id: { type: DataTypes.INTEGER, notNull: true },
    conversation_id: { type: DataTypes.INTEGER, notNull: true },
    user_input: { type: DataTypes.STRING },
    final_result: { type: DataTypes.STRING },
    total_tokens: { type: DataTypes.INTEGER },
    successful_requests: { type: DataTypes.INTEGER }
};

const schemaType = { columns: schema };

export type IUserCrewExecutions = Infer<typeof schemaType>;

export function getUserCrewExecutionsModel(env: Env) {
    return new Model(
        {
            D1Orm: getOrm(env),
            tableName: 'user_crew_executions',
            primaryKeys: 'id',
            autoIncrement: 'id',
        },
        schema
    );
}
