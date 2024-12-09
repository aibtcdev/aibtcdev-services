import { Model, DataTypes } from 'd1-orm';

export interface IUserConversations {
  id?: number;
  created_at?: string;
  updated_at?: string;
  profile_id: string;
  conversation_name: string;
}

export class UserConversations extends Model<typeof UserConversations.prototype.schema> {
  constructor(db: D1Database) {
    super(db, 'user_conversations');
  }

  schema = {
    id: { type: DataTypes.INTEGER, primary: true },
    created_at: { type: DataTypes.STRING },
    updated_at: { type: DataTypes.STRING },
    profile_id: { type: DataTypes.STRING, notNull: true },
    conversation_name: { type: DataTypes.STRING, notNull: true }
  };
}
