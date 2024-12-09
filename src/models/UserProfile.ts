import { Model, DataTypes } from 'd1-orm';

export interface IUserProfile {
	id?: number;
	created_at?: string;
	updated_at?: string;
	user_role: string;
	account_index?: number;
	stx_address: string;
	bns_address?: string;
}

export class UserProfile extends Model<typeof UserProfile.prototype.schema> {
	constructor(db: D1Database) {
		super(db, 'user_profiles');
	}

	schema = {
		id: { type: DataTypes.INTEGER, primary: true },
		created_at: { type: DataTypes.STRING },
		updated_at: { type: DataTypes.STRING },
		user_role: { type: DataTypes.STRING, notNull: true },
		account_index: { type: DataTypes.INTEGER },
		stx_address: { type: DataTypes.STRING, notNull: true, unique: true },
		bns_address: { type: DataTypes.STRING },
	};
}
