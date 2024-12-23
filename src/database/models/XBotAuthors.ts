import { Model, DataTypes, Infer } from 'd1-orm';
import { toCamelCase, toSnakeCase } from '../../utils/case-transformers';

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

// Original type for ORM operations
export type XBotAuthorsTable = Infer<typeof xBotAuthorsModel>;

// CamelCase interface for application use
export interface XBotAuthor {
    id: number;
    createdAt: string;
    updatedAt: string;
    authorId: string;
    realname?: string;
    username?: string;
}

// Transform functions with explicit mapping
export const transformXBotAuthorToCamelCase = (author: XBotAuthorsTable): XBotAuthor => ({
    id: author.id,
    createdAt: author.created_at || '',
    updatedAt: author.updated_at || '',
    authorId: author.author_id,
    realname: author.realname,
    username: author.username
});

export const transformXBotAuthorToSnakeCase = (author: Partial<XBotAuthor>): Partial<Omit<XBotAuthorsTable, 'id' | 'created_at' | 'updated_at'>> => ({
    author_id: author.authorId,
    realname: author.realname,
    username: author.username
});
