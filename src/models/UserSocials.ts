import { Model, DataTypes, type Infer } from 'd1-orm';
import { getOrm } from './orm-config';
import type { Env } from '../../worker-configuration';

const schema = {
    id: { type: DataTypes.INTEGER, notNull: true },
    created_at: { type: DataTypes.STRING },
    updated_at: { type: DataTypes.STRING },
    profile_id: { type: DataTypes.STRING, notNull: true },
    platform: { type: DataTypes.STRING, notNull: true },
    platform_id: { type: DataTypes.STRING, notNull: true }
};

const schemaType = { columns: schema };

export type IUserSocials = Infer<typeof schemaType>;

export function getUserSocialsModel(env: Env) {
    return new Model(
        {
            D1Orm: getOrm(env),
            tableName: 'user_socials',
            primaryKeys: 'id',
            autoIncrement: 'id',
        },
        schema
    );
}
