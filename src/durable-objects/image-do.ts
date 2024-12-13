import { DurableObject } from 'cloudflare:workers';
import { Env } from '../../worker-configuration';
import { createJsonResponse } from '../utils/requests-responses';
import { validateSharedKeyAuth } from '../utils/auth-helper';
import OpenAI from 'openai';

export class ImageGeneratorDO extends DurableObject<Env> {
	private readonly BASE_PATH = '/image';
	private readonly KEY_PREFIX = 'img';
	private readonly SUPPORTED_ENDPOINTS = ['/generate', '/get', '/list'];
	private openai: OpenAI;

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.ctx = ctx;
		this.env = env;

		// Initialize OpenAI client
		this.openai = new OpenAI({
			apiKey: env.OPENAI_API_KEY,
		});
	}

	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;

		if (!path.startsWith(this.BASE_PATH)) {
			return createJsonResponse({ error: `Invalid base path: ${path}` }, 404);
		}

		const endpoint = path.replace(this.BASE_PATH, '');

		// Require auth for all endpoints
		const authResult = await validateSharedKeyAuth(this.env, request);
		if (!authResult.success) {
			return createJsonResponse({ error: authResult.error }, authResult.status);
		}

		if (endpoint === '/generate') {
			if (request.method !== 'POST') {
				return createJsonResponse({ error: 'Method not allowed' }, 405);
			}

			try {
				const {
					prompt = 'The face of a 1950s-style robot, comic book style art, orange, red and black color theme.',
					size = '1024x1024',
					n = 1,
				} = (await request.json()) as { prompt: string; size?: string; n?: number };

				if (!prompt) {
					return createJsonResponse({ error: 'Prompt is required' }, 400);
				}

				// Generate image with OpenAI
				const response = await this.openai.images.generate({
					model: 'dall-e-3',
					prompt,
					n,
					size: size as any,
				});

				// Store each generated image in R2
				const storedImages = await Promise.all(
					response.data.map(async (image, index) => {
						const imageResponse = await fetch(image.url as any);
						const imageData = await imageResponse.blob();

						const key = `${this.KEY_PREFIX}_${Date.now()}_${index}`;
						const metadata = {
							prompt,
							generated: new Date().toISOString(),
							size,
						};

						await this.env.AIBTCDEV_SERVICES_BUCKET.put(key, imageData, {
							httpMetadata: {
								contentType: 'image/png',
								// customMetadata: metadata as any,
							},
						});

						return {
							key,
							url: `/image/get/${key}`,
							metadata,
						};
					})
				);

				return createJsonResponse({
					success: true,
					images: storedImages,
				});
			} catch (error) {
				console.error('Image generation failed:', error);
				return createJsonResponse(
					{
						error: 'Failed to generate or store image',
					},
					500
				);
			}
		}

		if (endpoint.startsWith('/get/')) {
			const key = endpoint.replace('/get/', '');
			try {
				const object = await this.env.AIBTCDEV_SERVICES_BUCKET.get(key);

				if (!object) {
					return createJsonResponse({ error: 'Image not found' }, 404);
				}

				return new Response(object.body, {
					headers: {
						'content-type': 'image/png',
						'cache-control': 'public, max-age=31536000',
					},
				});
			} catch (error) {
				return createJsonResponse({ error: 'Failed to retrieve image' }, 500);
			}
		}

		if (endpoint === '/list') {
			try {
				const options: R2ListOptions = {
					limit: 100,
					prefix: this.KEY_PREFIX,
					cursor: url.searchParams.get('cursor') || undefined,
				};

				const objects = await this.env.AIBTCDEV_SERVICES_BUCKET.list(options);

				return createJsonResponse({
					images: objects.objects.map((obj) => ({
						key: obj.key,
						url: `/image/get/${obj.key}`,
						size: obj.size,
						uploaded: obj.uploaded,
						// metadata: obj.httpMetadata?.customMetadata,
					})),
					truncated: objects.truncated,
					cursor: objects.truncated ? objects.cursor : undefined,
				});
			} catch (error) {
				return createJsonResponse({ error: 'Failed to list images' }, 500);
			}
		}

		return createJsonResponse({ error: `Unsupported endpoint: ${endpoint}` }, 404);
	}
}
