import { Model } from 'd1-orm';

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
    id: { type: 'number', primary: true },
    created_at: { type: 'string' },
    updated_at: { type: 'string' },
    profile_id: { type: 'string', notNull: true },
    crew_id: { type: 'number', notNull: true },
    agent_id: { type: 'number', notNull: true },
    task_name: { type: 'string', notNull: true },
    task_description: { type: 'string', notNull: true },
    task_expected_output: { type: 'string', notNull: true }
  };
}
