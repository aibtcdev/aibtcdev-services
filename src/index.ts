import { Env } from '../worker-configuration';
import { AppConfig } from './config';
import { corsHeaders, createJsonResponse } from './utils/requests-responses';
import { AuthDO } from './durable-objects/auth-do';
import { ContextDO } from './durable-objects/context-do';
import { DatabaseDO } from './durable-objects/database-do';
import { SchedulerDO } from './durable-objects/scheduler-do';
import { ToolsDO } from './durable-objects/tools-do';

// export the Durable Object classes we're using
export { AuthDO, ContextDO, DatabaseDO, SchedulerDO, ToolsDO };

export default {
	/**
	 * This is the standard fetch handler for a Cloudflare Worker
	 *
	 * @param request - The request submitted to the Worker from the client
	 * @param env - The interface to reference bindings declared in wrangler.toml
	 * @param ctx - The execution context of the Worker
	 * @returns The response to be sent back to the client
	 */
	async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
		// Handle CORS preflight requests
		if (request.method === 'OPTIONS') {
			return new Response(null, {
				headers: corsHeaders(request.headers.get('Origin') || undefined),
			});
		}

		// Initialize config with environment
		const config = AppConfig.getInstance(env).getConfig();
		const url = new URL(request.url);
		const path = url.pathname;

		if (path === '/') {
			return createJsonResponse({
				message: `Welcome to the aibtcdev-api-cache! Supported services: ${config.SUPPORTED_SERVICES.join(', ')}`,
			});
		}

		// For the Durable Object responses, the CORS headers will be added by the DO handlers

		if (path.startsWith('/auth')) {
			const id: DurableObjectId = env.AUTH_DO.idFromName('bns-do'); // create the instance
			const stub = env.AUTH_DO.get(id); // get the stub for communication
			return await stub.fetch(request); // forward the request to the Durable Object
		}

		if (path.startsWith('/context')) {
			const id: DurableObjectId = env.CONTEXT_DO.idFromName('hiro-api-do'); // create the instance
			const stub = env.CONTEXT_DO.get(id); // get the stub for communication
			return await stub.fetch(request); // forward the request to the Durable Object
		}

		if (path.startsWith('/database')) {
			const id: DurableObjectId = env.DATABASE_DO.idFromName('stx-city-do'); // create the instance
			const stub = env.DATABASE_DO.get(id); // get the stub for communication
			return await stub.fetch(request); // forward the request to the Durable Object
		}

		if (path.startsWith('/scheduler')) {
			let id: DurableObjectId = env.SCHEDULER_DO.idFromName('supabase-do'); // create the instance
			let stub = env.SCHEDULER_DO.get(id); // get the stub for communication
			return await stub.fetch(request); // forward the request to the Durable Object
		}

		if (path.startsWith('/tools')) {
			let id: DurableObjectId = env.TOOLS_DO.idFromName('supabase-do'); // create the instance
			let stub = env.TOOLS_DO.get(id); // get the stub for communication
			return await stub.fetch(request); // forward the request to the Durable Object
		}

		// Return 404 for any other path
		return createJsonResponse(
			{
				error: `Unsupported service at: ${path}, supported services: ${config.SUPPORTED_SERVICES.join(', ')}`,
			},
			404
		);
	},
} satisfies ExportedHandler<Env>;