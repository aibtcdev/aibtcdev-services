import { HandlerDefinition } from './types';
import { createApiResponse } from '../../utils/requests-responses';
import { validateSessionToken } from '../../utils/auth-helper';
import { getCronsByCrew, createCron, updateCronInput, toggleCronStatus, getEnabledCrons, getEnabledCronsDetailed } from '../helpers/crons';
import { UserCronsTable } from '../models';

export const cronsHandler: HandlerDefinition = {
	baseRoute: 'crons',
	endpoints: [
		{
			path: '/crons/enabled',
			methods: ['GET'],
			description: 'Get all enabled crons',
			requiresAuth: true,
		},
		{
			path: '/crons/enabled-detailed',
			methods: ['GET'],
			description: 'Get detailed information about enabled crons',
			requiresAuth: true,
		},
		{
			path: '/crons/get',
			methods: ['GET'],
			description: 'Get crons for a specific crew',
			requiresAuth: true,
			parameters: {
				crewId: 'ID of the crew to get crons for',
			},
		},
		{
			path: '/crons/create',
			methods: ['POST'],
			description: 'Create a new cron',
			requiresAuth: true,
			requestBody: {
				profileId: 'STX address of the user',
				crewId: 'ID of the crew',
				cronEnabled: 'Boolean indicating if cron is enabled',
				cronInterval: 'Optional: Cron schedule expression (default: "0 * * * *")',
				cronInput: 'Optional: Input data for the cron job',
			},
		},
		{
			path: '/crons/update',
			methods: ['PUT'],
			description: 'Update cron input',
			requiresAuth: true,
			parameters: {
				id: 'ID of the cron to update',
			},
			requestBody: {
				cronInput: 'New input data for the cron job',
			},
		},
		{
			path: '/crons/toggle',
			methods: ['PUT'],
			description: 'Toggle cron status',
			requiresAuth: true,
			parameters: {
				id: 'ID of the cron to toggle',
			},
			requestBody: {
				cronEnabled: 'Boolean indicating desired cron status',
			},
		},
	],
	handler: async ({ orm, env, request, url }) => {
		const endpoint = url.pathname.split('/').pop();

		switch (endpoint) {
			case 'enabled': {
				const crons = await getEnabledCrons(orm);
				return createApiResponse({
					message: 'Successfully retrieved enabled crons',
					data: { crons },
				});
			}

			case 'enabled-detailed': {
				const crons = await getEnabledCronsDetailed(orm);
				return createApiResponse({
					message: 'Successfully retrieved detailed cron information',
					data: { crons },
				});
			}

			case 'get': {
				const crewId = url.searchParams.get('crewId');
				if (!crewId) {
					return createApiResponse('Missing crewId parameter', 400);
				}
				const crons = await getCronsByCrew(orm, parseInt(crewId));
				return createApiResponse({
					message: 'Successfully retrieved crons for crew',
					data: { crons },
				});
			}

			case 'create': {
				if (request.method !== 'POST') {
					return createApiResponse('Method not allowed', 405);
				}
				const cronData = (await request.json()) as UserCronsTable;
				if (!cronData.profile_id || !cronData.crew_id || cronData.cron_enabled === undefined) {
					return createApiResponse('Missing required fields: profileId, crewId, cronEnabled', 400);
				}
				// Set defaults if not provided
				cronData.cron_interval = cronData.cron_interval || '0 * * * *'; // Default to hourly
				cronData.cron_input = cronData.cron_input || '';
				const cron = await createCron(orm, cronData);
				return createApiResponse({
					message: 'Successfully created cron',
					data: { cron },
				});
			}

			case 'update': {
				if (request.method !== 'PUT') {
					return createApiResponse('Method not allowed', 405);
				}
				const cronId = url.searchParams.get('id');
				if (!cronId) {
					return createApiResponse('Missing id parameter', 400);
				}
				const { cron_input: cronInput } = (await request.json()) as UserCronsTable;
				if (cronInput === undefined) {
					return createApiResponse('Missing cronInput in request body', 400);
				}
				const result = await updateCronInput(orm, parseInt(cronId), cronInput);
				return createApiResponse({
					message: 'Successfully updated cron input',
					data: { result },
				});
			}

			case 'toggle': {
				if (request.method !== 'PUT') {
					return createApiResponse('Method not allowed', 405);
				}
				const cronId = url.searchParams.get('id');
				if (!cronId) {
					return createApiResponse('Missing id parameter', 400);
				}
				const { cron_enabled: cronEnabled } = (await request.json()) as UserCronsTable;
				if (cronEnabled === undefined) {
					return createApiResponse('Missing cronEnabled in request body', 400);
				}
				const result = await toggleCronStatus(orm, parseInt(cronId), cronEnabled ? 1 : 0);
				return createApiResponse({
					message: 'Successfully toggled cron status',
					data: { result },
				});
			}

			default:
				return createApiResponse(`Unsupported crons endpoint: ${endpoint}`, 404);
		}
	},
};
