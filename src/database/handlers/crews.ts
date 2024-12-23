import { HandlerDefinition } from './types';
import { createApiResponse } from '../../utils/requests-responses';
import { validateSessionToken } from '../../utils/auth-helper';
import {
	getCrewsByProfile,
	getPublicCrews,
	getCrew,
	createCrew,
	updateCrew,
	deleteCrew,
	getCrewExecutions,
	addCrewExecution,
	getExecutionSteps,
	createExecutionStep,
	deleteExecutionSteps,
} from '../helpers/crews';
import { UserCrewsTable, UserCrewExecutionStepsTable } from '../models';

export const crewsHandler: HandlerDefinition = {
	baseRoute: 'crews',
	endpoints: [
		{
			path: '/crews/profile',
			methods: ['GET'],
			description: 'Get crews for a specific profile',
			requiresAuth: true,
			parameters: {
				address: 'STX address of the user',
			},
		},
		{
			path: '/crews/public',
			methods: ['GET'],
			description: 'Get all public crews',
			requiresAuth: false,
		},
		{
			path: '/crews/get',
			methods: ['GET'],
			description: 'Get a specific crew by ID',
			requiresAuth: true,
			parameters: {
				id: 'ID of the crew to retrieve',
			},
		},
		{
			path: '/crews/create',
			methods: ['POST'],
			description: 'Create a new crew',
			requiresAuth: true,
			requestBody: {
				profile_id: 'STX address of the user',
				crew_name: 'Name of the crew',
				crew_description: 'Optional description of the crew',
				is_public: 'Optional boolean indicating if crew is public',
			},
		},
		{
			path: '/crews/update',
			methods: ['PUT'],
			description: 'Update an existing crew',
			requiresAuth: true,
			parameters: {
				id: 'ID of the crew to update',
			},
			requestBody: {
				crew_name: 'Optional: New name of the crew',
				crew_description: 'Optional: New description of the crew',
				is_public: 'Optional: Boolean indicating if crew should be public',
			},
		},
		{
			path: '/crews/delete',
			methods: ['DELETE'],
			description: 'Delete a crew',
			requiresAuth: true,
			parameters: {
				id: 'ID of the crew to delete',
			},
		},
		{
			path: '/crews/executions',
			methods: ['GET'],
			description: 'Get crew executions for an address',
			requiresAuth: true,
			parameters: {
				address: 'STX address to get executions for',
			},
		},
		{
			path: '/crews/executions/add',
			methods: ['POST'],
			description: 'Add a new crew execution',
			requiresAuth: true,
			requestBody: {
				address: 'STX address of the user',
				crewId: 'ID of the crew',
				conversationId: 'ID of the conversation',
				input: 'Input data for the execution',
			},
		},
		{
			path: '/crews/steps/get',
			methods: ['GET'],
			description: 'Get execution steps',
			requiresAuth: true,
			parameters: {
				executionId: 'ID of the execution to get steps for',
			},
		},
		{
			path: '/crews/steps/create',
			methods: ['POST'],
			description: 'Create a new execution step',
			requiresAuth: true,
			requestBody: {
				profile_id: 'STX address of the user',
				crew_id: 'ID of the crew',
				execution_id: 'ID of the execution',
				step_type: 'Type of execution step',
				step_data: 'Data for the execution step',
			},
		},
		{
			path: '/crews/steps/delete',
			methods: ['DELETE'],
			description: 'Delete execution steps',
			requiresAuth: true,
			parameters: {
				executionId: 'ID of the execution to delete steps for',
			},
		},
	],
	handler: async ({ orm, env, request, url }) => {
		const endpoint = url.pathname.split('/').pop();

		switch (endpoint) {
			case 'profile': {
				const address = url.searchParams.get('address');
				if (!address) {
					return createApiResponse('Missing address parameter', 400);
				}

				// Get the session token from Authorization header
				const authHeader = request.headers.get('Authorization');
				if (!authHeader) {
					return createApiResponse('Missing authorization header', 401);
				}

				// Extract token from Bearer format
				const token = authHeader.replace('Bearer ', '');

				// Verify the token matches the requested address
				const tokenAddress = await validateSessionToken(env, token);
				if (!tokenAddress.success || tokenAddress.address !== address) {
					return createApiResponse('Unauthorized access', 403);
				}

				const crews = await getCrewsByProfile(orm, address);
				return createApiResponse({
					message: 'Successfully retrieved profile crews',
					data: { crews },
				});
			}

			case 'public': {
				const crews = await getPublicCrews(orm);
				return createApiResponse({
					message: 'Successfully retrieved public crews',
					data: { crews },
				});
			}

			case 'get': {
				const crewId = url.searchParams.get('id');
				if (!crewId) {
					return createApiResponse('Missing id parameter', 400);
				}
				const crew = await getCrew(orm, parseInt(crewId));
				return createApiResponse({
					message: 'Successfully retrieved crew',
					data: { crew },
				});
			}

			case 'create': {
				if (request.method !== 'POST') {
					return createApiResponse('Method not allowed', 405);
				}
				const crewData = (await request.json()) as Omit<UserCrewsTable, 'id' | 'created_at' | 'updated_at'>;
				if (!crewData.profile_id || !crewData.crew_name) {
					return createApiResponse('Missing required fields: profile_id, crew_name', 400);
				}
				const crew = await createCrew(orm, crewData);
				return createApiResponse({
					message: 'Successfully created crew',
					data: { crew },
				});
			}

			case 'update': {
				if (request.method !== 'PUT') {
					return createApiResponse('Method not allowed', 405);
				}
				const crewId = url.searchParams.get('id');
				if (!crewId) {
					return createApiResponse('Missing id parameter', 400);
				}
				const updates = (await request.json()) as Partial<Omit<UserCrewsTable, 'id' | 'created_at' | 'updated_at' | 'profile_id'>>;
				const result = await updateCrew(orm, parseInt(crewId), updates);
				return createApiResponse({
					message: 'Successfully updated crew',
					data: { result },
				});
			}

			case 'delete': {
				if (request.method !== 'DELETE') {
					return createApiResponse('Method not allowed', 405);
				}
				const crewId = url.searchParams.get('id');
				if (!crewId) {
					return createApiResponse('Missing id parameter', 400);
				}
				const result = await deleteCrew(orm, parseInt(crewId));
				return createApiResponse({
					message: 'Successfully deleted crew',
					data: { result },
				});
			}

			case 'executions': {
				const address = url.searchParams.get('address');
				if (!address) {
					return createApiResponse('Missing address parameter', 400);
				}
				const executions = await getCrewExecutions(orm, address);
				return createApiResponse({
					message: 'Successfully retrieved crew executions',
					data: { executions },
				});
			}

			case 'executions/add': {
				if (request.method !== 'POST') {
					return createApiResponse('Method not allowed', 405);
				}

				type AddCrewExecutionRequest = {
					address: string;
					crewId: number;
					conversationId: number;
					input: string;
				};

				const body: AddCrewExecutionRequest = await request.json();
				const { address, crewId, conversationId, input } = body;

				if (!address || !crewId || !conversationId || !input) {
					return createApiResponse('Missing required parameters: address, crewId, conversationId, input', 400);
				}

				const execution = await addCrewExecution(orm, address, crewId, conversationId, input);
				return createApiResponse({
					message: 'Successfully created crew execution',
					data: { execution },
				});
			}

			case 'steps/get': {
				const executionId = url.searchParams.get('executionId');
				if (!executionId) {
					return createApiResponse('Missing executionId parameter', 400);
				}

				// Get the session token from Authorization header
				const authHeader = request.headers.get('Authorization');
				if (!authHeader) {
					return createApiResponse('Missing authorization header', 401);
				}

				// Extract token from Bearer format
				const token = authHeader.replace('Bearer ', '');

				// Verify the token matches the requested address
				const tokenAddress = await validateSessionToken(env, token);
				if (!tokenAddress.success) {
					return createApiResponse('Unauthorized access', 403);
				}

				const steps = await getExecutionSteps(orm, parseInt(executionId));
				return createApiResponse({
					message: 'Successfully retrieved execution steps',
					data: { steps },
				});
			}

			case 'steps/create': {
				if (request.method !== 'POST') {
					return createApiResponse('Method not allowed', 405);
				}

				// Get the session token from Authorization header
				const authHeader = request.headers.get('Authorization');
				if (!authHeader) {
					return createApiResponse('Missing authorization header', 401);
				}

				// Extract token from Bearer format
				const token = authHeader.replace('Bearer ', '');

				// Verify the token
				const tokenAddress = await validateSessionToken(env, token);
				if (!tokenAddress.success) {
					return createApiResponse('Unauthorized access', 403);
				}

				const stepData = (await request.json()) as UserCrewExecutionStepsTable;
				if (!stepData.profile_id || !stepData.crew_id || !stepData.execution_id || !stepData.step_type || !stepData.step_data) {
					return createApiResponse('Missing required fields: profile_id, crew_id, execution_id, step_type, step_data', 400);
				}

				// Verify the profile_id matches the token address
				if (stepData.profile_id !== tokenAddress.address) {
					return createApiResponse('Unauthorized: profile_id does not match token', 403);
				}

				const step = await createExecutionStep(orm, stepData);
				return createApiResponse({
					message: 'Successfully created execution step',
					data: { step },
				});
			}

			case 'steps/delete': {
				if (request.method !== 'DELETE') {
					return createApiResponse('Method not allowed', 405);
				}

				const executionId = url.searchParams.get('executionId');
				if (!executionId) {
					return createApiResponse('Missing executionId parameter', 400);
				}

				// Get the session token from Authorization header
				const authHeader = request.headers.get('Authorization');
				if (!authHeader) {
					return createApiResponse('Missing authorization header', 401);
				}

				// Extract token from Bearer format
				const token = authHeader.replace('Bearer ', '');

				// Verify the token
				const tokenAddress = await validateSessionToken(env, token);
				if (!tokenAddress.success) {
					return createApiResponse('Unauthorized access', 403);
				}

				const result = await deleteExecutionSteps(orm, parseInt(executionId));
				return createApiResponse({
					message: 'Successfully deleted execution steps',
					data: { result },
				});
			}

			default:
				return createApiResponse(`Unsupported crews endpoint: ${endpoint}`, 404);
		}
	},
};
