import { Model, DataTypes, Infer } from 'd1-orm';
import { toCamelCase, toSnakeCase } from '../../utils/case-transformers';

export const xBotThreadsModel = new Model(
    {
        D1Orm: undefined,
        tableName: 'x_bot_threads',
        primaryKeys: 'id',
        autoIncrement: 'id',
    },
    {
        id: { type: DataTypes.INTEGER, notNull: true },
        created_at: { type: DataTypes.STRING },
        updated_at: { type: DataTypes.STRING },
    }
);

// Original type for ORM operations
export type XBotThreadsTable = Infer<typeof xBotThreadsModel>;

// CamelCase interface for application use
export interface XBotThread {
    id: number;
    createdAt: string;
    updatedAt: string;
}

// Transform functions using generic utility
export const transformToCamelCase = (thread: XBotThreadsTable): XBotThread => toCamelCase(thread);
export const transformToSnakeCase = (thread: Partial<XBotThread>): Partial<Omit<XBotThreadsTable, 'id' | 'created_at' | 'updated_at'>> => 
    toSnakeCase(thread);
