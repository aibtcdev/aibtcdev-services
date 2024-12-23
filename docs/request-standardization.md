# Request Standardization Guide

## Overview

This guide outlines our standardized approach to handling API requests, validations, and responses across all endpoints.

## Request Validation Utilities

We provide several utility functions in `src/utils/requests-responses.ts` to standardize request validation:

```typescript
// Validate required URL parameters
const validation = validateRequiredParams({ id: url.searchParams.get('id') }, ['id']);
if (!validation.isValid) {
  return createApiResponse(validation.error!, 400);
}

// Validate HTTP method
const methodValidation = validateMethod(request, ['POST']);
if (!methodValidation.isValid) {
  return createApiResponse(methodValidation.error!, 405);
}

// Validate request body
const bodyValidation = validateRequiredBody(body, ['profile_id', 'crew_id']);
if (!bodyValidation.isValid) {
  return createApiResponse(bodyValidation.error!, 400);
}
```

## Standard Response Format

All API responses follow this structure:

```typescript
{
  success: boolean;
  data?: {
    message: string;
    [key: string]: any;
  };
  error?: string;
}
```

### Success Response Example
```json
{
  "success": true,
  "data": {
    "message": "Successfully retrieved user profile",
    "profile": {
      "id": 1,
      "name": "John Doe"
    }
  }
}
```

### Error Response Example
```json
{
  "success": false,
  "error": "Missing required parameters: id"
}
```

## Implementation Guide

1. **URL Parameters**
   - Use `validateRequiredParams` for all required URL parameters
   - Check validation before processing the request
   - Return 400 status code for missing parameters

2. **HTTP Methods**
   - Use `validateMethod` to verify allowed HTTP methods
   - Return 405 status code for unsupported methods
   - Include allowed methods in error message

3. **Request Bodies**
   - Use `validateRequiredBody` for POST/PUT requests
   - Validate before processing the request
   - Return 400 status code for missing fields

4. **Response Creation**
   - Always use `createApiResponse` to ensure consistent format
   - Include descriptive messages for both success and error cases
   - Use standard HTTP status codes

## Example Handler Implementation

```typescript
export const handleEndpoint: Handler = async ({ orm, env, request, url }) => {
  // 1. Validate HTTP method
  const methodValidation = validateMethod(request, ['POST']);
  if (!methodValidation.isValid) {
    return createApiResponse(methodValidation.error!, 405);
  }

  // 2. Validate URL parameters
  const params = {
    id: url.searchParams.get('id'),
    type: url.searchParams.get('type')
  };
  const paramValidation = validateRequiredParams(params, ['id']);
  if (!paramValidation.isValid) {
    return createApiResponse(paramValidation.error!, 400);
  }

  // 3. Validate request body
  const body = await request.json();
  const bodyValidation = validateRequiredBody(body, ['name', 'description']);
  if (!bodyValidation.isValid) {
    return createApiResponse(bodyValidation.error!, 400);
  }

  // 4. Process request and return response
  try {
    const result = await processRequest(orm, params.id!, body);
    return createApiResponse({
      message: 'Successfully processed request',
      data: { result }
    });
  } catch (error) {
    return createApiResponse(error.message, 500);
  }
};
```

## Common Status Codes

- 200: Successful request
- 400: Bad request (missing parameters/fields)
- 401: Unauthorized
- 403: Forbidden
- 404: Resource not found
- 405: Method not allowed
- 500: Internal server error

## Migration Steps

1. Update existing handlers to use new validation utilities
2. Standardize error messages and status codes
3. Ensure all responses use createApiResponse
4. Update tests to verify standard format
5. Document any endpoint-specific requirements
