import { Model, DataTypes, type Infer } from 'd1-orm';
import { getOrm } from './orm-config';
import type { Env } from '../../worker-configuration';

const schema = {
    id: { type: DataTypes.INTEGER, notNull: true },
    created_at: { type: DataTypes.STRING },
    updated_at: { type: DataTypes.STRING },
    profile_id: { type: DataTypes.STRING, notNull: true },
    conversation_name: { type: DataTypes.STRING, notNull: true }
};

const schemaType = { columns: schema };

export type IUserConversations = Infer<typeof schemaType>;

export function getUserConversationsModel(env: Env) {
    return new Model(
        {
            D1Orm: getOrm(env),
            tableName: 'user_conversations',
            primaryKeys: 'id',
            autoIncrement: 'id',
        },
        schema
    );
}
