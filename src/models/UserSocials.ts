import { Model } from 'd1-orm';

export interface IUserSocials {
  id?: number;
  created_at?: string;
  updated_at?: string;
  profile_id: string;
  platform: string;
  platform_id: string;
}

export class UserSocials extends Model<typeof UserSocials.prototype.schema> {
  constructor(db: D1Database) {
    super(db, 'user_socials');
  }

  schema = {
    id: { type: 'number', primary: true },
    created_at: { type: 'string' },
    updated_at: { type: 'string' },
    profile_id: { type: 'string', notNull: true },
    platform: { type: 'string', notNull: true },
    platform_id: { type: 'string', notNull: true }
  };
}
