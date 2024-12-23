import { Handler, HandlerDefinition } from './types';
import { profilesHandler } from './profiles';
import { conversationsHandler } from './conversations';
import { crewsHandler } from './crews';
import { agentsHandler } from './agents';
import { tasksHandler } from './tasks';
import { cronsHandler } from './crons';
import { twitterHandler } from './twitter';

const handlerDefinitions: HandlerDefinition[] = [
    profilesHandler,
    conversationsHandler,
    crewsHandler,
    agentsHandler,
    tasksHandler,
    cronsHandler,
    twitterHandler
];

export const getHandler = (path: string): Handler | undefined => {
    const segment = path.split('/')[1];
    const definition = handlerDefinitions.find(def => def.baseRoute === segment);
    return definition?.handler;
};

export const getSupportedEndpoints = (): string[] => {
    return handlerDefinitions.flatMap(def => 
        def.endpoints.map(endpoint => endpoint.path)
    );
};

export const getEndpointDocumentation = () => {
    return handlerDefinitions.map(def => ({
        baseRoute: def.baseRoute,
        endpoints: def.endpoints
    }));
};
