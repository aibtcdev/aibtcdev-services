# Implementation Guide: createJsonResponse

This guide outlines the standardized implementation of `createJsonResponse` across all endpoints.

## Response Formats

### 1. Successful Responses (Status Codes 200-299)

#### When Returning Data

```javascript
createJsonResponse({
	message: 'A clear description of what succeeded',
	data: theActualData,
});
```

#### When Returning Message Only

```javascript
createJsonResponse({
	message: 'A clear description of what succeeded',
});
```

### 2. Error Responses (Status Codes 300+)

Use a direct string message:

```javascript
createJsonResponse('A clear description of what went wrong', errorStatusCode);
```

## Implementation Guidelines

### 3. Specific Patterns

- Never wrap response data in unnecessary object literals (e.g., avoid `{ result }` when `result` is already an object)
- Always include a descriptive message for successful operations
- Keep error messages concise and descriptive
- Use consistent status codes for similar types of errors

### 4. Implementation Examples

#### Success with Data

```javascript
return createJsonResponse({
	message: 'Successfully retrieved crews',
	data: crews,
});
```

#### Success with Message Only

```javascript
return createJsonResponse({
	message: `Successfully deleted ${key}`,
});
```

#### Error Response

```javascript
return createJsonResponse('Missing required parameter: address', 400);
```

## Response Structure

The `createJsonResponse` function automatically wraps these responses in a standardized format that includes:

- A success boolean flag
- Either a data or error property based on the status code

This standardization ensures consistent response structures across all endpoints and makes it easier for clients to handle responses predictably.
