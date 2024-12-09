import { D1Orm } from 'd1-orm';
import type { Env } from '../../worker-configuration';

let orm: D1Orm | null = null;

export function getOrm(env: Env): D1Orm {
    if (!orm) {
        orm = new D1Orm(env.AIBTCDEV_SERVICES_DB);
    }
    return orm;
}
