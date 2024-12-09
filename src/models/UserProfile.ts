import { Model, DataTypes, type Infer } from 'd1-orm';
import { getOrm } from './orm-config';
import type { Env } from '../../worker-configuration';

const schema = {
    id: { type: DataTypes.INTEGER, notNull: true },
    created_at: { type: DataTypes.STRING },
    updated_at: { type: DataTypes.STRING },
    user_role: { type: DataTypes.STRING, notNull: true },
    account_index: { type: DataTypes.INTEGER },
    stx_address: { type: DataTypes.STRING, notNull: true },
    bns_address: { type: DataTypes.STRING },
};

export type IUserProfile = Infer<typeof schema>;

export function getUserProfileModel(env: Env) {
    return new Model({
        D1Orm: getOrm(env),
        tableName: 'user_profiles',
        primaryKeys: 'id',
        autoIncrement: 'id',
        uniqueKeys: [['stx_address']],
    }, schema);
}
