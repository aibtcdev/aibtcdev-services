import { DurableObject } from '@cloudflare/workers-types';
import { Env } from '../../worker-configuration';
import { createJsonResponse } from '../utils/requests-responses';
import { validateDurableObjectAuth, validateSessionToken } from '../utils/auth-helper';

export class CdnDO extends DurableObject<Env> {
    private readonly BASE_PATH = '/cdn';
    private readonly SUPPORTED_ENDPOINTS: string[] = [
        '/',  // For GET/POST/DELETE operations
    ];

    async fetch(request: Request): Promise<Response> {
        const url = new URL(request.url);
        const path = url.pathname;

        // Validate DO auth for all requests
        const authResult = await validateDurableObjectAuth(this.env, request);
        if (!authResult.success) {
            return createJsonResponse({ error: authResult.error }, authResult.status);
        }

        if (!path.startsWith(this.BASE_PATH)) {
            return createJsonResponse(
                {
                    error: `Request at ${path} does not start with base path ${this.BASE_PATH}`,
                },
                404
            );
        }

        // Handle the request based on method
        switch (request.method) {
            case 'GET':
                return this.handleGet(request);
            case 'POST':
                return this.handlePost(request);
            case 'DELETE':
                return this.handleDelete(request);
            default:
                return createJsonResponse(
                    { error: 'Method not allowed' },
                    405,
                    { headers: { Allow: 'GET, POST, DELETE' } }
                );
        }
    }

    private async handleGet(request: Request): Promise<Response> {
        const url = new URL(request.url);
        const key = url.pathname.replace(this.BASE_PATH + '/', '');
        
        try {
            const object = await this.env.AIBTCDEV_SERVICES_BUCKET.get(key);
            
            if (!object) {
                return createJsonResponse({ error: 'Object not found' }, 404);
            }

            // Return the object with appropriate headers
            return new Response(object.body, {
                headers: {
                    'content-type': object.httpMetadata?.contentType || 'application/octet-stream',
                    'etag': object.httpEtag,
                    'cache-control': object.httpMetadata?.cacheControl || 'public, max-age=31536000',
                }
            });
        } catch (error) {
            return createJsonResponse({ error: 'Failed to retrieve object' }, 500);
        }
    }

    private async handlePost(request: Request): Promise<Response> {
        // Validate session token from Authorization header
        const sessionToken = request.headers.get('Authorization');
        if (!sessionToken) {
            return createJsonResponse({ error: 'Missing Authorization header' }, 401);
        }

        const authResult = await validateSessionToken(this.env, sessionToken);
        if (!authResult.success) {
            return createJsonResponse({ error: authResult.error }, 401);
        }

        const url = new URL(request.url);
        const key = url.pathname.replace(this.BASE_PATH + '/', '');
        
        try {
            const object = await this.env.AIBTCDEV_SERVICES_BUCKET.put(key, request.body, {
                httpMetadata: {
                    contentType: request.headers.get('content-type') || 'application/octet-stream',
                }
            });
            
            return createJsonResponse({ success: true, key, etag: object.httpEtag });
        } catch (error) {
            return createJsonResponse({ error: 'Failed to store object' }, 500);
        }
    }

    private async handleDelete(request: Request): Promise<Response> {
        // Validate session token from Authorization header
        const sessionToken = request.headers.get('Authorization');
        if (!sessionToken) {
            return createJsonResponse({ error: 'Missing Authorization header' }, 401);
        }

        const authResult = await validateSessionToken(this.env, sessionToken);
        if (!authResult.success) {
            return createJsonResponse({ error: authResult.error }, 401);
        }

        const url = new URL(request.url);
        const key = url.pathname.replace(this.BASE_PATH + '/', '');
        
        try {
            await this.env.AIBTCDEV_SERVICES_BUCKET.delete(key);
            return createJsonResponse({ success: true, key });
        } catch (error) {
            return createJsonResponse({ error: 'Failed to delete object' }, 500);
        }
    }
}
