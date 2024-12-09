import { Model } from 'd1-orm';

export interface IUserConversations {
  id?: number;
  created_at?: string;
  updated_at?: string;
  profile_id: string;
  conversation_name: string;
}

export class UserConversations extends Model<IUserConversations> {
  constructor(db: D1Database) {
    super(db, 'user_conversations');
  }

  schema = {
    id: { type: 'number', primary: true },
    created_at: { type: 'string' },
    updated_at: { type: 'string' },
    profile_id: { type: 'string', notNull: true },
    conversation_name: { type: 'string', notNull: true }
  };
}
