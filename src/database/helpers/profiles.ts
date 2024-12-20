import { D1Orm } from 'd1-orm';
import { userProfilesModel, UserProfilesTable } from '../models';

/** PROFILE MANAGEMENT */

interface ProfileResult {
	profile?: UserProfilesTable;
	profiles?: UserProfilesTable[];
	success: boolean;
	error?: string;
}

/**
 * Get a user's role by their STX address
 * @param orm The D1Orm instance from durable object class
 * @param address The Stacks address for the user's profile
 * @returns Promise containing the user's role or error details
 * @throws Error if database query fails
 */
export async function getUserRole(orm: D1Orm, address: string): Promise<{ success: boolean; role?: string; error?: string }> {
	try {
		userProfilesModel.SetOrm(orm);
		const profile = await userProfilesModel.First({
			where: {
				stx_address: address,
			},
		});
		return {
			role: profile ? profile.user_role : undefined,
			success: true,
		};
	} catch (error) {
		console.error(`Error in getUserRole: ${error instanceof Error ? error.message : String(error)}`);
		return {
			success: false,
			error: `Failed to get user role: ${error instanceof Error ? error.message : String(error)}`,
		};
	}
}

/**
 * Get a complete user profile by STX address
 * @param orm The D1Orm instance from durable object class
 * @param address The Stacks address for the user's profile
 * @returns Promise containing the user profile or error details
 * @throws Error if database query fails
 */
export async function getUserProfile(orm: D1Orm, address: string): Promise<ProfileResult> {
	try {
		userProfilesModel.SetOrm(orm);
		const profile = await userProfilesModel.First({
			where: {
				stx_address: address,
			},
		});
		return {
			profile: profile as unknown as UserProfilesTable,
			success: true,
		};
	} catch (error) {
		console.error(`Error in getUserProfile: ${error instanceof Error ? error.message : String(error)}`);
		return {
			success: false,
			error: `Failed to get user profile: ${error instanceof Error ? error.message : String(error)}`,
		};
	}
}

/**
 * Create a new user profile
 * @param orm The D1Orm instance from durable object class
 * @param profileData The profile configuration data
 * @returns Promise containing the created profile or error details
 * @throws Error if database insertion fails
 */
export async function createUserProfile(
	orm: D1Orm,
	profileData: Omit<UserProfilesTable, 'id' | 'created_at' | 'updated_at'>
): Promise<ProfileResult> {
	try {
		userProfilesModel.SetOrm(orm);
		const profile = await userProfilesModel.InsertOne(profileData);
		return {
			profile: profile as unknown as UserProfilesTable,
			success: true,
		};
	} catch (error) {
		console.error(`Error in createUserProfile: ${error instanceof Error ? error.message : String(error)}`);
		return {
			success: false,
			error: `Failed to create user profile: ${error instanceof Error ? error.message : String(error)}`,
		};
	}
}

/**
 * Update an existing user profile
 * @param orm The D1Orm instance from durable object class
 * @param address The Stacks address for the user's profile
 * @param profileData The fields to update on the profile
 * @returns Promise containing the update result or error details
 * @throws Error if database update fails
 */
export async function updateUserProfile(
	orm: D1Orm,
	address: string,
	profileData: Partial<Pick<UserProfilesTable, 'user_role' | 'account_index' | 'bns_address'>>
): Promise<ProfileResult> {
	try {
		userProfilesModel.SetOrm(orm);
		await userProfilesModel.Update({
			where: {
				stx_address: address,
			},
			data: profileData,
		});
		return {
			success: true,
		};
	} catch (error) {
		console.error(`Error in updateUserProfile: ${error instanceof Error ? error.message : String(error)}`);
		return {
			success: false,
			error: `Failed to update user profile: ${error instanceof Error ? error.message : String(error)}`,
		};
	}
}

/**
 * Delete a user profile
 * @param orm The D1Orm instance from durable object class
 * @param address The Stacks address for the user's profile
 * @returns Promise containing the deletion result or error details
 * @throws Error if database deletion fails
 */
export async function deleteUserProfile(orm: D1Orm, address: string): Promise<ProfileResult> {
	try {
		userProfilesModel.SetOrm(orm);
		await userProfilesModel.Delete({
			where: {
				stx_address: address,
			},
		});
		return {
			success: true,
		};
	} catch (error) {
		console.error(`Error in deleteUserProfile: ${error instanceof Error ? error.message : String(error)}`);
		return {
			success: false,
			error: `Failed to delete user profile: ${error instanceof Error ? error.message : String(error)}`,
		};
	}
}

/**
 * Get all user profiles (admin endpoint)
 * @param orm The D1Orm instance from durable object class
 * @returns Promise containing array of profiles or error details
 * @throws Error if database query fails
 */
export async function getAllUserProfiles(orm: D1Orm): Promise<ProfileResult> {
	try {
		userProfilesModel.SetOrm(orm);
		const result = await userProfilesModel.All({
			orderBy: [
				{
					column: 'created_at',
					descending: true,
				},
			],
		});
		return {
			profiles: result.results as unknown as UserProfilesTable[],
			success: true,
		};
	} catch (error) {
		console.error(`Error in getAllUserProfiles: ${error instanceof Error ? error.message : String(error)}`);
		return {
			profiles: [],
			success: false,
			error: `Failed to get all user profiles: ${error instanceof Error ? error.message : String(error)}`,
		};
	}
}

/**
 * Update a user profile by ID (admin endpoint)
 * @param orm The D1Orm instance from durable object class
 * @param userId The ID of the profile to update
 * @param updates The fields to update on the profile
 * @returns Promise containing the update result or error details
 * @throws Error if database update fails
 */
export async function updateUserProfileById(
	orm: D1Orm,
	userId: number,
	updates: Partial<Pick<UserProfilesTable, 'user_role' | 'account_index' | 'bns_address'>>
): Promise<ProfileResult> {
	try {
		userProfilesModel.SetOrm(orm);
		await userProfilesModel.Update({
			where: {
				id: userId,
			},
			data: updates,
		});
		return {
			success: true,
		};
	} catch (error) {
		console.error(`Error in updateUserProfileById: ${error instanceof Error ? error.message : String(error)}`);
		return {
			success: false,
			error: `Failed to update user profile by ID: ${error instanceof Error ? error.message : String(error)}`,
		};
	}
}
