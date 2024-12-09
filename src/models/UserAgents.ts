import { Model, DataTypes } from 'd1-orm';

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

export class UserAgents extends Model<typeof UserAgents.prototype.schema> {
	constructor(db: D1Database) {
		super(db, 'user_agents');
	}

	schema = {
		id: { type: DataTypes.INTEGER, primary: true },
		created_at: { type: DataTypes.STRING },
		updated_at: { type: DataTypes.STRING },
		profile_id: { type: DataTypes.STRING, notNull: true },
		crew_id: { type: DataTypes.INTEGER, notNull: true },
		agent_name: { type: DataTypes.STRING, notNull: true },
		agent_role: { type: DataTypes.STRING, notNull: true },
		agent_goal: { type: DataTypes.STRING, notNull: true },
		agent_backstory: { type: DataTypes.STRING, notNull: true },
		agent_tools: { type: DataTypes.STRING }, // Will store JSON string of tools array
	};
}
