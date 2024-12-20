import { Env } from '../worker-configuration';
import { AppConfig } from './config';
import { corsHeaders, createApiResponse, createUnsupportedEndpointResponse } from './utils/requests-responses';
import { AuthDO } from './auth/auth-do';
import { CdnDO } from './cdn/cdn-do';
import { ContextDO } from './context/context-do';
import { DatabaseDO } from './database/database-do';
import { ImageGeneratorDO } from './image-generator/image-generator.do';
import { MetadataGeneratorDO } from './metadata-generator/metadata-generator.do';
import { SchedulerDO } from './scheduler/scheduler-do';
import { ToolsDO } from './tools/tools-do';

// export the Durable Object classes we're using
export { AuthDO, CdnDO, ContextDO, DatabaseDO, ImageGeneratorDO, MetadataGeneratorDO, SchedulerDO, ToolsDO };

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

		// Handle root path
		if (path === '' || path === '/') {
			return createApiResponse({
				message: 'aibtc.dev services online',
				data: {
					endpoints: config.SUPPORTED_SERVICES,
				},
			});
		}

		// For the Durable Object responses, the CORS headers will be added by the DO handlers

		if (path.startsWith('/auth')) {
			const id: DurableObjectId = env.AUTH_DO.idFromName('auth-do'); // create the instance
			const stub = env.AUTH_DO.get(id); // get the stub for communication
			return await stub.fetch(request); // forward the request to the Durable Object
		}

		if (path.startsWith('/cdn')) {
			let id: DurableObjectId = env.CDN_DO.idFromName('cdn-do'); // create the instance
			let stub = env.CDN_DO.get(id); // get the stub for communication
			return await stub.fetch(request); // forward the request to the Durable Object
		}

		if (path.startsWith('/context')) {
			const id: DurableObjectId = env.CONTEXT_DO.idFromName('context-do'); // create the instance
			const stub = env.CONTEXT_DO.get(id); // get the stub for communication
			return await stub.fetch(request); // forward the request to the Durable Object
		}

		if (path.startsWith('/database')) {
			const id: DurableObjectId = env.DATABASE_DO.idFromName('database-do'); // create the instance
			const stub = env.DATABASE_DO.get(id); // get the stub for communication
			return await stub.fetch(request); // forward the request to the Durable Object
		}

		if (path.startsWith('/image-generator')) {
			let id: DurableObjectId = env.IMAGE_GENERATOR_DO.idFromName('image-generator-do'); // create the instance
			let stub = env.IMAGE_GENERATOR_DO.get(id); // get the stub for communication
			return await stub.fetch(request); // forward the request to the Durable Object
		}

		if (path.startsWith('/metadata-generator')) {
			let id: DurableObjectId = env.METADATA_GENERATOR_DO.idFromName('metadata-generator-do'); // create the instance
			let stub = env.METADATA_GENERATOR_DO.get(id); // get the stub for communication
			return await stub.fetch(request); // forward the request to the Durable Object
		}

		if (path.startsWith('/scheduler')) {
			let id: DurableObjectId = env.SCHEDULER_DO.idFromName('scheduler-do'); // create the instance
			let stub = env.SCHEDULER_DO.get(id); // get the stub for communication
			return await stub.fetch(request); // forward the request to the Durable Object
		}

		if (path.startsWith('/tools')) {
			let id: DurableObjectId = env.TOOLS_DO.idFromName('tools-do'); // create the instance
			let stub = env.TOOLS_DO.get(id); // get the stub for communication
			return await stub.fetch(request); // forward the request to the Durable Object
		}

		// Return 404 for any other path
		return createUnsupportedEndpointResponse(path, config.SUPPORTED_SERVICES);
	},
} satisfies ExportedHandler<Env>;
