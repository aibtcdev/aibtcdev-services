import { Model } from 'd1-orm';

export interface IUserCrewExecutions {
  id?: number;
  created_at?: string;
  updated_at?: string;
  profile_id: string;
  crew_id: number;
  conversation_id: number;
  user_input?: string;
  final_result?: string;
  total_tokens?: number;
  successful_requests?: number;
}

export class UserCrewExecutions extends Model {
  constructor(db: D1Database) {
    super(db, 'user_crew_executions');
  }

  schema = {
    id: { type: 'number', primary: true },
    created_at: { type: 'string' },
    updated_at: { type: 'string' },
    profile_id: { type: 'string', notNull: true },
    crew_id: { type: 'number', notNull: true },
    conversation_id: { type: 'number', notNull: true },
    user_input: { type: 'string' },
    final_result: { type: 'string' },
    total_tokens: { type: 'number' },
    successful_requests: { type: 'number' }
  };
}
