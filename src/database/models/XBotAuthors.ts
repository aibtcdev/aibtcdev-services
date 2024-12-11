import { Model, DataTypes, Infer } from 'd1-orm';

export const xBotAuthorsModel = new Model(
    {
        D1Orm: undefined,
        tableName: 'x_bot_authors',
        primaryKeys: 'id',
        autoIncrement: 'id',
    },
    {
        id: { type: DataTypes.INTEGER, notNull: true },
        created_at: { type: DataTypes.STRING },
        updated_at: { type: DataTypes.STRING },
        author_id: { type: DataTypes.STRING, notNull: true },
        realname: { type: DataTypes.STRING },
        username: { type: DataTypes.STRING },
    }
);

export type XBotAuthorsTable = Infer<typeof xBotAuthorsModel>;
