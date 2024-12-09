import { Model, DataTypes, type Infer } from 'd1-orm';
import { getOrm } from './orm-config';
import type { Env } from '../../worker-configuration';

const schema = {
    id: { type: DataTypes.INTEGER, notNull: true },
    created_at: { type: DataTypes.STRING },
    updated_at: { type: DataTypes.STRING },
    profile_id: { type: DataTypes.STRING, notNull: true },
    crew_id: { type: DataTypes.INTEGER, notNull: true },
    agent_id: { type: DataTypes.INTEGER, notNull: true },
    task_name: { type: DataTypes.STRING, notNull: true },
    task_description: { type: DataTypes.STRING, notNull: true },
    task_expected_output: { type: DataTypes.STRING, notNull: true }
};

const schemaType = { columns: schema };

export type IUserTasks = Infer<typeof schemaType>;

export function getUserTasksModel(env: Env) {
    return new Model(
        {
            D1Orm: getOrm(env),
            tableName: 'user_tasks',
            primaryKeys: 'id',
            autoIncrement: 'id',
        },
        schema
    );
}
