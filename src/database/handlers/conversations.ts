import { Handler, HandlerDefinition } from './types';
import { createApiResponse } from '../../utils/requests-responses';
import { getConversations, getLatestConversation, getConversationHistory, addConversation } from '../helpers/conversations';
import { UserConversationsTable } from '../models';

export const conversationsHandler: HandlerDefinition = {
    baseRoute: 'conversations',
    endpoints: [
        {
            path: '/conversations/conversations',
            methods: ['GET'],
            description: 'Get all conversations for an address'
        },
        {
            path: '/conversations/latest',
            methods: ['GET'],
            description: 'Get latest conversation for an address'
        },
        {
            path: '/conversations/history',
            methods: ['GET'],
            description: 'Get conversation history by ID'
        },
        {
            path: '/conversations/create',
            methods: ['POST'],
            description: 'Create a new conversation'
        }
    ],
    handler: async ({ orm, request, url }) => {
	const endpoint = url.pathname.split('/').pop();

	switch (endpoint) {
		case 'conversations':
			const address = url.searchParams.get('address');
			if (!address) {
				return createApiResponse('Missing address parameter', 400);
			}
			const conversations = await getConversations(orm, address);
			return createApiResponse({
				message: 'Successfully retrieved conversations',
				data: conversations,
			});

		case 'latest':
			const latestAddress = url.searchParams.get('address');
			if (!latestAddress) {
				return createApiResponse('Missing address parameter', 400);
			}
			const conversation = await getLatestConversation(orm, latestAddress);
			return createApiResponse({
				message: 'Successfully retrieved latest conversation',
				data: conversation,
			});

		case 'history':
			const conversationId = url.searchParams.get('id');
			if (!conversationId) {
				return createApiResponse('Missing conversation ID parameter', 400);
			}
			const history = await getConversationHistory(orm, parseInt(conversationId));
			return createApiResponse({
				message: 'Successfully retrieved conversation history',
				data: history,
			});

		case 'create':
			if (request.method !== 'POST') {
				return createApiResponse('Method not allowed', 405);
			}
			const { profile_id, conversation_name } = (await request.json()) as UserConversationsTable;
			if (!profile_id) {
				return createApiResponse('Missing required field: address', 400);
			}
			const result = await addConversation(orm, profile_id, conversation_name ? conversation_name : 'new conversation');
			return createApiResponse({
				message: 'Successfully created conversation',
				data: { result },
			});

		default:
			return createApiResponse(`Unsupported conversations endpoint: ${endpoint}`, 404);
	}
};
