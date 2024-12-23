import { HandlerDefinition } from './types';
import { createApiResponse } from '../../utils/requests-responses';
import {
	getUserRole,
	getUserProfile,
	createUserProfile,
	updateUserProfile,
	deleteUserProfile,
	getAllUserProfiles,
	updateUserProfileById,
} from '../helpers/profiles';
import { UserProfilesTable } from '../models';

export const profilesHandler: HandlerDefinition = {
	baseRoute: 'profiles',
	endpoints: [
		{
			path: '/profiles/role',
			methods: ['GET'],
			description: 'Get user role by address',
		},
		{
			path: '/profiles/get',
			methods: ['GET'],
			description: 'Get user profile by address',
		},
		{
			path: '/profiles/create',
			methods: ['POST'],
			description: 'Create new user profile',
		},
		{
			path: '/profiles/update',
			methods: ['PUT'],
			description: 'Update existing user profile',
		},
		{
			path: '/profiles/delete',
			methods: ['DELETE'],
			description: 'Delete user profile',
		},
		{
			path: '/profiles/list',
			methods: ['GET'],
			description: 'Get all user profiles',
		},
		{
			path: '/profiles/admin-update',
			methods: ['PUT'],
			description: 'Admin update of user profile by ID',
		},
	],
	handler: async ({ orm, env, request, url }) => {
		const endpoint = url.pathname.split('/').pop();

		switch (endpoint) {
			case 'role': {
				const address = url.searchParams.get('address');
				if (!address) {
					return createApiResponse('Missing address parameter', 400);
				}
				const role = await getUserRole(orm, address);
				return createApiResponse({
					message: 'Successfully retrieved user role',
					data: { role },
				});
			}

			case 'get': {
				const address = url.searchParams.get('address');
				if (!address) {
					return createApiResponse('Missing address parameter', 400);
				}
				const profile = await getUserProfile(orm, address);
				return createApiResponse({
					message: 'Successfully retrieved user profile',
					data: { profile },
				});
			}

			case 'create': {
				if (request.method !== 'POST') {
					return createApiResponse('Method not allowed', 405);
				}
				const profileData = (await request.json()) as UserProfilesTable;
				if (!profileData.stx_address || !profileData.user_role) {
					return createApiResponse('Missing required fields: stx_address, user_role', 400);
				}
				const profile = await createUserProfile(orm, profileData);
				return createApiResponse({
					message: 'Successfully created user profile',
					data: { profile },
				});
			}

			case 'update': {
				if (request.method !== 'PUT') {
					return createApiResponse('Method not allowed', 405);
				}
				const address = url.searchParams.get('address');
				if (!address) {
					return createApiResponse('Missing address parameter', 400);
				}
				const profileData = (await request.json()) as UserProfilesTable;
				const result = await updateUserProfile(orm, address, profileData);
				return createApiResponse({
					message: 'Successfully updated user profile',
					data: { result },
				});
			}

			case 'delete': {
				if (request.method !== 'DELETE') {
					return createApiResponse('Method not allowed', 405);
				}
				const address = url.searchParams.get('address');
				if (!address) {
					return createApiResponse('Missing address parameter', 400);
				}
				const result = await deleteUserProfile(orm, address);
				return createApiResponse({
					message: 'Successfully deleted user profile',
					data: { result },
				});
			}

			case 'list': {
				const profiles = await getAllUserProfiles(orm);
				return createApiResponse({
					message: 'Successfully retrieved all user profiles',
					data: { profiles },
				});
			}

			case 'admin-update': {
				if (request.method !== 'PUT') {
					return createApiResponse('Method not allowed', 405);
				}
				const userId = url.searchParams.get('userId');
				if (!userId) {
					return createApiResponse('Missing userId parameter', 400);
				}
				const updates = (await request.json()) as UserProfilesTable;
				const result = await updateUserProfileById(orm, parseInt(userId), updates);
				return createApiResponse({
					message: 'Successfully updated user profile',
					data: { result },
				});
			}

			default:
				return createApiResponse(`Unsupported profiles endpoint: ${endpoint}`, 404);
		}
	},
};
