import { Handler } from './types';
import { handleConversations } from './conversations';

const handlers: Record<string, Handler> = {
	conversations: handleConversations,
	// Add more handlers as needed
};

export const getHandler = (path: string): Handler | undefined => {
	const segment = path.split('/')[1];
	return handlers[segment];
};
