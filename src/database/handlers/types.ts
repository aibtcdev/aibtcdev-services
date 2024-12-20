import { D1Orm } from 'd1-orm';
import { Env } from '../../../worker-configuration';

export interface HandlerContext {
	orm: D1Orm;
	env: Env;
	request: Request;
	url: URL;
}

export type Handler = (context: HandlerContext) => Promise<Response>;
