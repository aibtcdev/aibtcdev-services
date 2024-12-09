import { Model, DataTypes, type Infer } from 'd1-orm';
import { getOrm } from './orm-config';
import type { Env } from '../../worker-configuration';

const schema = {
    id: { type: DataTypes.INTEGER, notNull: true },
    created_at: { type: DataTypes.STRING },
    updated_at: { type: DataTypes.STRING },
    profile_id: { type: DataTypes.STRING, notNull: true },
    crew_name: { type: DataTypes.STRING, notNull: true },
    crew_description: { type: DataTypes.STRING },
    crew_executions: { type: DataTypes.INTEGER },
    crew_is_public: { type: DataTypes.INTEGER }
};

const schemaType = { columns: schema };

export type IUserCrews = Infer<typeof schemaType>;

export function getUserCrewsModel(env: Env) {
    return new Model(
        {
            D1Orm: getOrm(env),
            tableName: 'user_crews',
            primaryKeys: 'id',
            autoIncrement: 'id',
        },
        schema
    );
}
