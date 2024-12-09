import { Model, DataTypes } from 'd1-orm';

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
    id: { type: DataTypes.INTEGER, primary: true },
    created_at: { type: DataTypes.STRING },
    crew_id: { type: DataTypes.INTEGER, notNull: true },
    execution_id: { type: DataTypes.INTEGER, notNull: true },
    step_type: { type: DataTypes.STRING, notNull: true },
    step_data: { type: DataTypes.STRING, notNull: true }
  };
}
