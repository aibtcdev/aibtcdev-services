import { Model } from 'd1-orm';

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
		id: { type: 'number', primary: true },
		created_at: { type: 'string' },
		updated_at: { type: 'string' },
		user_role: { type: 'string', notNull: true },
		account_index: { type: 'number' },
		stx_address: { type: 'string', notNull: true, unique: true },
		bns_address: { type: 'string' },
	};
}
