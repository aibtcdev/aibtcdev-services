import { Model, DataTypes } from 'd1-orm';

export interface IUserTasks {
  id?: number;
  created_at?: string;
  updated_at?: string;
  profile_id: string;
  crew_id: number;
  agent_id: number;
  task_name: string;
  task_description: string;
  task_expected_output: string;
}

export class UserTasks extends Model<typeof UserTasks.prototype.schema> {
  constructor(db: D1Database) {
    super(db, 'user_tasks');
  }

  schema = {
    id: { type: DataTypes.INTEGER, primary: true },
    created_at: { type: DataTypes.STRING },
    updated_at: { type: DataTypes.STRING },
    profile_id: { type: DataTypes.STRING, notNull: true },
    crew_id: { type: DataTypes.INTEGER, notNull: true },
    agent_id: { type: DataTypes.INTEGER, notNull: true },
    task_name: { type: DataTypes.STRING, notNull: true },
    task_description: { type: DataTypes.STRING, notNull: true },
    task_expected_output: { type: DataTypes.STRING, notNull: true }
  };
}
