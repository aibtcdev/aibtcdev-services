import { Model, DataTypes } from 'd1-orm';

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
    id: { type: DataTypes.INTEGER, primary: true },
    created_at: { type: DataTypes.STRING },
    updated_at: { type: DataTypes.STRING },
    profile_id: { type: DataTypes.STRING, notNull: true },
    platform: { type: DataTypes.STRING, notNull: true },
    platform_id: { type: DataTypes.STRING, notNull: true }
  };
}
