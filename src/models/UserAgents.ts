import { Model, DataTypes, type Infer } from 'd1-orm';
import { getOrm } from './orm-config';
import type { Env } from '../../worker-configuration';

const schema = {
    id: { type: DataTypes.INTEGER, notNull: true },
    created_at: { type: DataTypes.STRING },
    updated_at: { type: DataTypes.STRING },
    profile_id: { type: DataTypes.STRING, notNull: true },
    crew_id: { type: DataTypes.INTEGER, notNull: true },
    agent_name: { type: DataTypes.STRING, notNull: true },
    agent_role: { type: DataTypes.STRING, notNull: true },
    agent_goal: { type: DataTypes.STRING, notNull: true },
    agent_backstory: { type: DataTypes.STRING, notNull: true },
    agent_tools: { type: DataTypes.STRING }, // Will store JSON string of tools array
};

const schemaType = { columns: schema };

export type IUserAgents = Infer<typeof schemaType>;

export function getUserAgentsModel(env: Env) {
    return new Model(
        {
            D1Orm: getOrm(env),
            tableName: 'user_agents',
            primaryKeys: 'id',
            autoIncrement: 'id',
        },
        schema
    );
}
