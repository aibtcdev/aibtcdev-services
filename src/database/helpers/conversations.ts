import { D1Orm } from 'd1-orm';
import { userConversationsModel, userCrewExecutionsModel, userCrewExecutionStepsModel } from '../models';

/** CONVERSATION MANAGEMENT */

interface ConversationData {
    id: number;
    created_at: string;
    updated_at: string;
    profile_id: string;
    conversation_name: string;
}

interface ConversationResult {
    conversation?: ConversationData;
    conversations?: ConversationData[];
    success: boolean;
    error?: string;
}

/**
 * Create a new conversation for a profile
 * @param orm The D1Orm instance from durable object class
 * @param address The Stacks address for the user's profile
 * @param name The name of the conversation (defaults to 'New Conversation')
 * @returns Promise containing the created conversation or error details
 * @throws Error if database insertion fails
 */
export async function addConversation(
    orm: D1Orm, 
    address: string, 
    name: string = 'New Conversation'
): Promise<ConversationResult> {
    try {
        userConversationsModel.SetOrm(orm);
        const conversation = await userConversationsModel.InsertOne({
            profile_id: address,
            conversation_name: name,
        });
        return {
            conversation: conversation as ConversationData,
            success: true
        };
    } catch (error) {
        console.error(`Error in addConversation: ${error instanceof Error ? error.message : String(error)}`);
        return {
            success: false,
            error: `Failed to create conversation: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}

/**
 * Update an existing conversation
 * @param orm The D1Orm instance from durable object class
 * @param address The Stacks address for the user's profile
 * @param conversationId The ID of the conversation to update
 * @param name Optional new name for the conversation
 * @returns Promise containing the update result or error details
 * @throws Error if database update fails
 */
export async function updateConversation(
    orm: D1Orm, 
    address: string, 
    conversationId: number, 
    name?: string
): Promise<ConversationResult> {
    try {
        userConversationsModel.SetOrm(orm);
        await userConversationsModel.Update({
            where: {
                id: conversationId,
                profile_id: address,
            },
            data: {
                conversation_name: name,
            },
        });
        return {
            success: true
        };
    } catch (error) {
        console.error(`Error in updateConversation: ${error instanceof Error ? error.message : String(error)}`);
        return {
            success: false,
            error: `Failed to update conversation: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}

/**
 * Delete a specific conversation
 * @param orm The D1Orm instance from durable object class
 * @param address The Stacks address for the user's profile
 * @param conversationId The ID of the conversation to delete
 * @returns Promise containing the deletion result or error details
 * @throws Error if database deletion fails
 */
export async function deleteConversation(
    orm: D1Orm, 
    address: string, 
    conversationId: number
): Promise<ConversationResult> {
    try {
        userConversationsModel.SetOrm(orm);
        await userConversationsModel.Delete({
            where: {
                id: conversationId,
                profile_id: address,
            },
        });
        return {
            success: true
        };
    } catch (error) {
        console.error(`Error in deleteConversation: ${error instanceof Error ? error.message : String(error)}`);
        return {
            success: false,
            error: `Failed to delete conversation: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}

/**
 * Get a specific conversation by ID
 * @param orm The D1Orm instance from durable object class
 * @param conversationId The ID of the conversation to retrieve
 * @returns Promise containing the conversation data or error details
 * @throws Error if database query fails
 */
export async function getConversation(
    orm: D1Orm, 
    conversationId: number
): Promise<ConversationResult> {
    try {
        userConversationsModel.SetOrm(orm);
        const conversation = await userConversationsModel.First({
            where: {
                id: conversationId,
            },
        });
        return {
            conversation: conversation as ConversationData,
            success: true
        };
    } catch (error) {
        console.error(`Error in getConversation: ${error instanceof Error ? error.message : String(error)}`);
        return {
            success: false,
            error: `Failed to get conversation: ${error instanceof Error ? error.message : String(error)}`
        };
    }
}

/**
 * Get a conversation with associated crew executions.
 * @param orm The orm instance from durable object class
 * @param conversationId The ID of the conversation
 */
export async function getConversationWithExecutions(orm: D1Orm, conversationId: number) {
	userConversationsModel.SetOrm(orm);
	userCrewExecutionsModel.SetOrm(orm);

	const conversation = await userConversationsModel.First({
		where: {
			id: conversationId,
		},
	});

	if (!conversation) {
		return null;
	}

	const executions = await userCrewExecutionsModel.All({
		where: {
			conversation_id: conversationId,
		},
		orderBy: [
			{
				column: 'created_at',
				descending: true,
			},
		],
	});

	return {
		conversation,
		executions,
	};
}

/**
 * Get all conversations for a profile.
 * @param orm The orm instance from durable object class
 * @param address The Stacks address for the user's profile.
 */
export async function getConversations(orm: D1Orm, address: string) {
	userConversationsModel.SetOrm(orm);
	const conversations = await userConversationsModel.All({
		where: {
			profile_id: address,
		},
		orderBy: [
			{
				column: 'created_at',
				descending: true,
			},
		],
	});
	return conversations;
}

/**
 * Get all conversations with their associated crew executions for a profile.
 * @param orm The orm instance from durable object class
 * @param address The Stacks address for the user's profile
 */
export async function getConversationsWithExecutions(orm: D1Orm, address: string) {
	userConversationsModel.SetOrm(orm);
	userCrewExecutionsModel.SetOrm(orm);

	const conversations = await userConversationsModel.All({
		where: {
			profile_id: address,
		},
		orderBy: [
			{
				column: 'created_at',
				descending: true,
			},
		],
	});

	const result = [];
	for (const conversation of conversations.results) {
		const executions = await userCrewExecutionsModel.All({
			where: {
				conversation_id: conversation.id,
				profile_id: address,
			},
			orderBy: [
				{
					column: 'created_at',
					descending: true,
				},
			],
		});

		result.push({
			conversation,
			executions,
		});
	}

	return result;
}

/**
 * Get the most recent conversation for a profile.
 * @param orm The orm instance from durable object class
 * @param address The Stacks address for the user's profile.
 */
export async function getLatestConversation(orm: D1Orm, address: string) {
	userConversationsModel.SetOrm(orm);
	const conversation = await userConversationsModel.All({
		where: {
			profile_id: address,
		},
		orderBy: [
			{
				column: 'created_at',
				descending: true,
			},
		],
		limit: 1,
	});
	// return first array entry because of limit 1
	return conversation.results[0];
}

/**
 * Get the ID of the most recent conversation for a profile.
 * @param orm The orm instance from durable object class
 * @param address The Stacks address for the user's profile
 */
export async function getLatestConversationId(orm: D1Orm, address: string) {
	const conversation = await getLatestConversation(orm, address);
	return conversation.id;
}

/**
 * Get conversation history in chronological order.
 * @param orm The orm instance from durable object class
 * @param conversationId The ID of the conversation
 */
export async function getConversationHistory(orm: D1Orm, conversationId: number) {
	userConversationsModel.SetOrm(orm);
	userCrewExecutionsModel.SetOrm(orm);
	userCrewExecutionStepsModel.SetOrm(orm);

	// Get all executions for this conversation
	const executions = await userCrewExecutionsModel.All({
		where: {
			conversation_id: conversationId,
		},
		orderBy: [
			{
				column: 'created_at',
				descending: false,
			},
		],
	});

	const history = [];
	for (const execution of executions.results) {
		// Get all steps for this execution
		const steps = await userCrewExecutionStepsModel.All({
			where: {
				execution_id: execution.id,
			},
			orderBy: [
				{
					column: 'created_at',
					descending: false,
				},
			],
		});

		history.push({
			execution,
			steps,
		});
	}

	return history;
}
