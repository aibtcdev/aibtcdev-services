import { Model } from 'd1-orm';

export interface IUserAgents {
  id?: number;
  created_at?: string;
  updated_at?: string;
  profile_id: string;
  crew_id: number;
  agent_name: string;
  agent_role: string;
  agent_goal: string;
  agent_backstory: string;
  agent_tools?: string; // Stored as JSON string
}

export class UserAgents extends Model {
  constructor(db: D1Database) {
    super(db, 'user_agents');
  }

  schema = {
    id: { type: 'number', primary: true },
    created_at: { type: 'string' },
    updated_at: { type: 'string' },
    profile_id: { type: 'string', notNull: true },
    crew_id: { type: 'number', notNull: true },
    agent_name: { type: 'string', notNull: true },
    agent_role: { type: 'string', notNull: true },
    agent_goal: { type: 'string', notNull: true },
    agent_backstory: { type: 'string', notNull: true },
    agent_tools: { type: 'string' } // Will store JSON string of tools array
  };
}
