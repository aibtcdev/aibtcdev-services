# API Endpoint Management

This document describes our approach to managing API endpoints using TypeScript handlers with built-in documentation.

## Overview

Instead of maintaining a manual list of endpoints, we define endpoints alongside their handlers using TypeScript types and interfaces. This provides:

- Self-documenting API endpoints
- Automatic endpoint validation
- Better developer experience
- Centralized endpoint documentation
- Helpful error messages with contextual endpoint suggestions

## Implementation

### 1. Handler Types

```typescript
// src/database/handlers/types.ts
export interface HandlerEndpoint {
    path: string;
    methods: string[];
    description?: string;
}

export interface HandlerDefinition {
    baseRoute: string;
    endpoints: HandlerEndpoint[];
    handler: Handler;
}

export interface HandlerContext {
    orm: D1Orm;
    env: Env;
    request: Request;
    url: URL;
}

export type Handler = (context: HandlerContext) => Promise<Response>;
```

### 2. Handler Implementation

Example of a handler with endpoint definitions:

```typescript
// src/database/handlers/profiles.ts
export const profilesHandler: HandlerDefinition = {
    baseRoute: 'profiles',
    endpoints: [
        { 
            path: '/profiles/role', 
            methods: ['GET'], 
            description: 'Get user role' 
        },
        { 
            path: '/profiles/get', 
            methods: ['GET'], 
            description: 'Get user profile' 
        },
        // ... more endpoints
    ],
    handler: async ({ orm, env, request, url }) => {
        // Handler implementation
    }
};
```

### 3. Central Handler Registry

```typescript
// src/database/handlers/index.ts
const handlerDefinitions: HandlerDefinition[] = [
    profilesHandler,
    conversationsHandler,
    // ... other handlers
];

export const getHandler = (path: string): Handler | undefined => {
    const segment = path.split('/')[1];
    return handlers[segment];
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
```

### 4. Error Handling

```typescript
// src/utils/requests-responses.ts
export function createUnsupportedEndpointResponse(
    endpoint: string, 
    documentation: ReturnType<typeof getEndpointDocumentation>
): Response {
    const baseRoute = endpoint.split('/')[1];
    let message = `Unsupported endpoint: ${endpoint}\n\n`;

    const routeDocs = documentation.find(d => d.baseRoute === baseRoute);
    if (routeDocs) {
        message += `Available endpoints for '${baseRoute}':\n`;
        routeDocs.endpoints.forEach(e => {
            message += `  ${e.path} [${e.methods.join(', ')}]`;
            if (e.description) {
                message += ` - ${e.description}`;
            }
            message += '\n';
        });
    } else {
        message += 'Available routes:\n';
        documentation.forEach(d => {
            message += `  /${d.baseRoute} endpoints:\n`;
            d.endpoints.forEach(e => {
                message += `    ${e.path} [${e.methods.join(', ')}]`;
                if (e.description) {
                    message += ` - ${e.description}`;
                }
                message += '\n';
            });
        });
    }

    return createApiResponse(message, 404);
}
```

## Benefits

1. **Self-Documentation**: Endpoints are defined alongside their implementation
2. **Type Safety**: TypeScript interfaces ensure consistent endpoint definitions
3. **Maintainability**: Single source of truth for endpoint definitions
4. **Developer Experience**: Helpful error messages with available endpoints
5. **Extensibility**: Easy to add new metadata fields to endpoints

## Example Error Messages

### Invalid Profile Endpoint
```
Unsupported endpoint: /profiles/invalid

Available endpoints for 'profiles':
  /profiles/role [GET] - Get user role
  /profiles/get [GET] - Get user profile
  /profiles/create [POST] - Create new user profile
  /profiles/update [PUT] - Update user profile
  /profiles/delete [DELETE] - Delete user profile
```

### Unknown Route
```
Unsupported endpoint: /unknown

Available routes:
  /profiles endpoints:
    /profiles/role [GET] - Get user role
    /profiles/get [GET] - Get user profile
  /conversations endpoints:
    /conversations/latest [GET] - Get latest conversation
    /conversations/history [GET] - Get conversation history
```

## Implementation Steps

1. Create the TypeScript interfaces in `types.ts`
2. Update existing handlers to use the new `HandlerDefinition` format
3. Create the central handler registry
4. Update error handling to use the new documentation system
5. Update the DatabaseDO class to use the new endpoint management

## Future Enhancements

- Add authentication requirements to endpoint definitions
- Include rate limiting information
- Add request/response schema documentation
- Generate OpenAPI/Swagger documentation
- Add versioning information to endpoints
