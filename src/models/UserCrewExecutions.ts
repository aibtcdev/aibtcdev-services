import { Model, DataTypes } from 'd1-orm';

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

export class UserCrewExecutions extends Model<typeof UserCrewExecutions.prototype.schema> {
  constructor(db: D1Database) {
    super(db, 'user_crew_executions');
  }

  schema = {
    id: { type: DataTypes.INTEGER, primary: true },
    created_at: { type: DataTypes.STRING },
    updated_at: { type: DataTypes.STRING },
    profile_id: { type: DataTypes.STRING, notNull: true },
    crew_id: { type: DataTypes.INTEGER, notNull: true },
    conversation_id: { type: DataTypes.INTEGER, notNull: true },
    user_input: { type: DataTypes.STRING },
    final_result: { type: DataTypes.STRING },
    total_tokens: { type: DataTypes.INTEGER },
    successful_requests: { type: DataTypes.INTEGER }
  };
}
