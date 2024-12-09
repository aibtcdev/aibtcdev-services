import { Model, DataTypes } from 'd1-orm';

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

export class UserCrews extends Model<typeof UserCrews.prototype.schema> {
  constructor(db: D1Database) {
    super(db, 'user_crews');
  }

  schema = {
    id: { type: DataTypes.INTEGER, primary: true },
    created_at: { type: DataTypes.STRING },
    updated_at: { type: DataTypes.STRING },
    profile_id: { type: DataTypes.STRING, notNull: true },
    crew_name: { type: DataTypes.STRING, notNull: true },
    crew_description: { type: DataTypes.STRING },
    crew_executions: { type: DataTypes.INTEGER, default: 0 },
    crew_is_public: { type: DataTypes.INTEGER, default: 0 }
  };
}
