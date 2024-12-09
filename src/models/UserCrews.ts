import { Model } from 'd1-orm';

export interface IUserCrews {
  id?: number;
  created_at?: string;
  updated_at?: string;
  profile_id: string;
  crew_name: string;
  crew_description?: string;
  crew_executions?: number;
  crew_is_public?: number;
}

export class UserCrews extends Model<IUserCrews> {
  constructor(db: D1Database) {
    super(db, 'user_crews');
  }

  schema = {
    id: { type: 'number', primary: true },
    created_at: { type: 'string' },
    updated_at: { type: 'string' },
    profile_id: { type: 'string', notNull: true },
    crew_name: { type: 'string', notNull: true },
    crew_description: { type: 'string' },
    crew_executions: { type: 'number', default: 0 },
    crew_is_public: { type: 'number', default: 0 }
  };
}
