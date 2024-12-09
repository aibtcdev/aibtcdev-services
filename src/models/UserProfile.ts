import { Model, DataTypes, type Infer } from 'd1-orm';

export class UserProfile extends Model<typeof UserProfile.prototype.schema> {
	static schema = {
		id: { type: DataTypes.INTEGER, primary: true },
		created_at: { type: DataTypes.STRING },
		updated_at: { type: DataTypes.STRING },
		user_role: { type: DataTypes.STRING, notNull: true },
		account_index: { type: DataTypes.INTEGER },
		stx_address: { type: DataTypes.STRING, notNull: true, unique: true },
		bns_address: { type: DataTypes.STRING },
	};
	constructor(db: D1Database) {
		super(db, 'user_profiles');
	}

	schema = UserProfile.schema;
}

export type IUserProfile = Infer<typeof UserProfile.schema>;
