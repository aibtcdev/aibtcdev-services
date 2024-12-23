import { DurableObject } from 'cloudflare:workers';
import { Env } from '../../worker-configuration';
import { createApiResponse, createUnsupportedEndpointResponse } from '../utils/requests-responses';
import { validateSharedKeyAuth } from '../utils/auth-helper';

interface TokenMetadata {
	name?: string;
	symbol?: string;
	decimals?: number;
	description?: string;
	image?: string;
	image_data?: string;
	identifier?: string;
	external_url?: string;
	background_color?: string;
	animation_url?: string;
	youtube_url?: string;
	properties?: Record<string, any>;
}

interface GenerateMetadataRequest {
	name: string;
	symbol: string;
	decimals: number;
	description: string;
	identifier: string;
	properties?: Record<string, any>;
	imagePrompt?: string;
}

export class MetadataGeneratorDO extends DurableObject<Env> {
	private readonly BASE_PATH = '/metadata';
	private readonly KEY_PREFIX = 'sip10';
	private readonly SUPPORTED_ENDPOINTS = ['/generate', '/update'];

	constructor(ctx: DurableObjectState, env: Env) {
		super(ctx, env);
		this.ctx = ctx;
		this.env = env;
	}

	async fetch(request: Request): Promise<Response> {
		const url = new URL(request.url);
		const path = url.pathname;

		const endpoint = path.replace(this.BASE_PATH, '');

		// Handle root path
		if (endpoint === '' || endpoint === '/') {
			return createApiResponse({
				message: 'metadata generator service',
				data: {
					endpoints: this.SUPPORTED_ENDPOINTS,
				},
			});
		}

		// Require auth for all endpoints
		const authResult = await validateSharedKeyAuth(this.env, request);
		if (!authResult.success) {
			return createApiResponse(authResult.error, authResult.status);
		}

		// Extract contract ID from the path
		const contractIdMatch = endpoint.match(/\/(SP[A-Z0-9]+\.[^\/]+)/);
		if (!contractIdMatch) {
			return createApiResponse('Invalid contract ID format', 400);
		}
		const contractId = contractIdMatch[1];

		if (endpoint.startsWith('/generate/')) {
			if (request.method !== 'POST') {
				return createApiResponse('Method not allowed', 405);
			}
			return this.generateMetadata(contractId, request);
		}

		if (endpoint.startsWith('/update/')) {
			if (request.method !== 'POST' && request.method !== 'PATCH') {
				return createApiResponse('Method not allowed', 405);
			}
			return this.updateMetadata(contractId, request);
		}

		if (endpoint.startsWith('/')) {
			return this.getMetadata(contractId);
		}

		return createUnsupportedEndpointResponse(endpoint, this.SUPPORTED_ENDPOINTS);
	}

	private async generateMetadata(contractId: string, request: Request): Promise<Response> {
		try {
			const data = (await request.json()) as GenerateMetadataRequest;

			// Validate required fields
			const requiredFields = ['name', 'symbol', 'decimals', 'description'];
			const missingFields = requiredFields.filter((field) => !(field in data));
			if (missingFields.length > 0) {
				return createApiResponse(`Missing required fields: ${missingFields.join(', ')}`, 400);
			}

			// Generate image using ImageGeneratorDO
			const imageGeneratorId = this.env.IMAGE_GENERATOR_DO.idFromName('image-generator-do');
			const imageGenerator = this.env.IMAGE_GENERATOR_DO.get(imageGeneratorId);

			// Create image prompt based on token details
			const imagePrompt =
				data.imagePrompt ||
				`Create a professional logo or icon for a cryptocurrency token named ${data.name} (${data.symbol}). ${data.description}. Use a style that reflects the token's purpose and brand identity. Make it suitable for use as a token icon.`;

			const imageResponse = await imageGenerator.fetch(
				new Request('https://worker/image/generate', {
					method: 'POST',
					headers: request.headers,
					body: JSON.stringify({
						prompt: imagePrompt,
						size: '1024x1024',
						n: 1,
					}),
				})
			);

			if (!imageResponse.ok) {
				throw new Error('Failed to generate image');
			}

			const imageResult: any = await imageResponse.json();
			const imageUrl = imageResult.images[0].url;

			// Construct metadata
			const metadata: TokenMetadata = {
				name: data.name,
				symbol: data.symbol,
				decimals: data.decimals,
				description: data.description,
				image: imageUrl,
				identifier: data.identifier,
				properties: {
					...data.properties,
					generated: {
						date: new Date().toISOString(),
						imagePrompt,
					},
				},
			};

			// Store metadata
			const key = `${this.KEY_PREFIX}_${contractId}`;
			await this.env.AIBTCDEV_SERVICES_BUCKET.put(key, JSON.stringify(metadata), {
				httpMetadata: {
					contentType: 'application/json',
				},
			});

			return createApiResponse({
				message: 'Successfully generated metadata',
				data: { contractId, metadata },
			});
		} catch (error) {
			console.error('Failed to generate metadata:', error);
			return createApiResponse('Failed to generate metadata', 500);
		}
	}

	private async getMetadata(contractId: string): Promise<Response> {
		try {
			const key = `${this.KEY_PREFIX}_${contractId}`;
			const object = await this.env.AIBTCDEV_SERVICES_BUCKET.get(key);

			if (!object) {
				return createApiResponse('Metadata not found', 404);
			}

			const metadata: any = await object.json();
			return createApiResponse({
				message: 'Successfully retrieved metadata',
				data: {
					metadata,
					contractId,
					lastUpdated: object.uploaded,
				},
			});
		} catch (error) {
			console.error('Failed to get metadata:', error);
			return createApiResponse('Failed to retrieve metadata', 500);
		}
	}

	private async updateMetadata(contractId: string, request: Request): Promise<Response> {
		try {
			const key = `${this.KEY_PREFIX}_${contractId}`;
			const updates = (await request.json()) as Partial<TokenMetadata>;

			// Validate required fields if this is a full update (POST)
			if (request.method === 'POST') {
				const requiredFields = ['name', 'description', 'image'];
				const missingFields = requiredFields.filter((field) => !(field in updates));
				if (missingFields.length > 0) {
					return createApiResponse(`Missing required fields: ${missingFields.join(', ')}`, 400);
				}
			}

			// Get existing metadata if this is a partial update
			let currentMetadata: TokenMetadata = {};
			if (request.method === 'PATCH') {
				const existing = await this.env.AIBTCDEV_SERVICES_BUCKET.get(key);
				if (existing) {
					currentMetadata = await existing.json();
				}
			}

			// Merge updates with existing metadata
			const newMetadata = {
				...currentMetadata,
				...updates,
				lastUpdated: new Date().toISOString(),
			};

			// Store updated metadata
			await this.env.AIBTCDEV_SERVICES_BUCKET.put(key, JSON.stringify(newMetadata), {
				httpMetadata: {
					contentType: 'application/json',
				},
			});

			return createApiResponse({
				message: 'Successfully updated metadata',
				data: { contractId, metadata: newMetadata },
			});
		} catch (error) {
			console.error('Failed to update metadata:', error);
			return createApiResponse('Failed to update metadata', 500);
		}
	}
}
