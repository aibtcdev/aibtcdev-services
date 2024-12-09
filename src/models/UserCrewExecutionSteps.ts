import { Model } from 'd1-orm';

export interface IUserCrewExecutionSteps {
  id?: number;
  created_at?: string;
  crew_id: number;
  execution_id: number;
  step_type: string;
  step_data: string;
}

export class UserCrewExecutionSteps extends Model<typeof UserCrewExecutionSteps.prototype.schema> {
  constructor(db: D1Database) {
    super(db, 'user_crew_execution_steps');
  }

  schema = {
    id: { type: 'number', primary: true },
    created_at: { type: 'string' },
    crew_id: { type: 'number', notNull: true },
    execution_id: { type: 'number', notNull: true },
    step_type: { type: 'string', notNull: true },
    step_data: { type: 'string', notNull: true }
  };
}
