import { Model, DataTypes, Infer } from 'd1-orm';

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
    }
);

export type XBotThreadsTable = Infer<typeof xBotThreadsModel>;
