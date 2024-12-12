import { D1Orm } from 'd1-orm';
import { userProfilesModel } from '../models';

/** PROFILE MANAGEMENT */

/**
 * Get a user's role by their STX address
 */
export async function getUserRole(orm: D1Orm, address: string) {
    userProfilesModel.SetOrm(orm);
    const profile = await userProfilesModel.First({
        where: {
            stx_address: address
        },
        select: ['user_role']
    });
    return profile;
}

/**
 * Get a complete user profile by STX address
 */
export async function getUserProfile(orm: D1Orm, address: string) {
    userProfilesModel.SetOrm(orm);
    const profile = await userProfilesModel.First({
        where: {
            stx_address: address
        }
    });
    return profile;
}

/**
 * Create a new user profile
 */
export async function createUserProfile(orm: D1Orm, profileData: {
    user_role: string;
    account_index?: number;
    stx_address: string;
    bns_address?: string;
}) {
    userProfilesModel.SetOrm(orm);
    const profile = await userProfilesModel.InsertOne(profileData);
    return profile;
}

/**
 * Update an existing user profile
 */
export async function updateUserProfile(orm: D1Orm, address: string, profileData: {
    user_role?: string;
    account_index?: number;
    bns_address?: string;
}) {
    userProfilesModel.SetOrm(orm);
    const result = await userProfilesModel.Update({
        where: {
            stx_address: address
        },
        data: profileData
    });
    return result;
}

/**
 * Delete a user profile
 */
export async function deleteUserProfile(orm: D1Orm, address: string) {
    userProfilesModel.SetOrm(orm);
    const result = await userProfilesModel.Delete({
        where: {
            stx_address: address
        }
    });
    return result;
}
