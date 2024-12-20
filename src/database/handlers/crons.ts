import { Handler } from './types';
import { createApiResponse } from '../../utils/requests-responses';
import { validateSessionToken } from '../../utils/auth-helper';
import { getCronsByCrew, createCron, updateCronInput, toggleCronStatus, getEnabledCrons, getEnabledCronsDetailed } from '../helpers/crons';
import { UserCronsTable } from '../models';

export const handleCrons: Handler = async ({ orm, env, request, url }) => {
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
				return createApiResponse('Missing required fields: profile_id, crew_id, cron_enabled', 400);
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
			const { cron_input } = (await request.json()) as UserCronsTable;
			if (cron_input === undefined) {
				return createApiResponse('Missing cron_input in request body', 400);
			}
			const result = await updateCronInput(orm, parseInt(cronId), cron_input);
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
			const { cron_enabled } = (await request.json()) as UserCronsTable;
			if (cron_enabled === undefined) {
				return createApiResponse('Missing cron_enabled in request body', 400);
			}
			const result = await toggleCronStatus(orm, parseInt(cronId), cron_enabled ? 1 : 0);
			return createApiResponse({
				message: 'Successfully toggled cron status',
				data: { result },
			});
		}

		default:
			return createApiResponse(`Unsupported crons endpoint: ${endpoint}`, 404);
	}
};
