import { D1Orm } from 'd1-orm';
import { Env } from '../../../worker-configuration';

export interface HandlerEndpoint {
    path: string;
    methods: string[];
    description?: string;
}

export interface HandlerDefinition {
    baseRoute: string;
    endpoints: HandlerEndpoint[];
    handler: Handler;
}

export interface HandlerContext {
    orm: D1Orm;
    env: Env;
    request: Request;
    url: URL;
}

export type Handler = (context: HandlerContext) => Promise<Response>;
