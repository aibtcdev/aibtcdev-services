# Implementation Guide: createApiResponse

This guide outlines the standardized implementation of `createApiResponse` across all endpoints.

## Response Formats

### 1. Successful Responses (Status Codes 200-299)

#### When Returning Data

```javascript
createApiResponse({
    message: 'A clear description of what succeeded',
    data: { theActualData }
});
```

#### When Returning Message Only

```javascript
createApiResponse({
    message: 'A clear description of what succeeded'
});
```

### 2. Error Responses (Status Codes 300+)

Use a direct string message:

```javascript
createApiResponse('A clear description of what went wrong', errorStatusCode);
```

## Implementation Guidelines

### 3. Specific Patterns

- Always include a descriptive message for successful operations
- Keep error messages concise and descriptive
- Use consistent status codes for similar types of errors
- Data should be structured as an object when including additional information

### 4. Implementation Examples

#### Success with Data

```javascript
return createApiResponse({
    message: 'Successfully retrieved crews',
    data: { crews }
});
```

#### Success with Message Only

```javascript
return createApiResponse({
    message: `Successfully deleted ${key}`
});
```

#### Error Response

```javascript
return createApiResponse('Missing required parameter: address', 400);
```

## Response Structure

The `createApiResponse` function automatically wraps responses in a standardized format that includes:

- A success boolean flag (true for 200-299 status codes, false otherwise)
- For successful responses:
  - data object containing message and any additional data
- For error responses:
  - error string with the error message

Example Success Response:
```json
{
    "success": true,
    "data": {
        "message": "Successfully retrieved crews",
        "crews": [...]
    }
}
```

Example Error Response:
```json
{
    "success": false,
    "error": "Missing required parameter: address"
}
```

This standardization ensures consistent response structures across all endpoints and makes it easier for clients to handle responses predictably.
