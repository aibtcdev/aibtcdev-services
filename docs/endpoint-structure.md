## 1. Successful Responses (Status Codes 200-299)

### When Returning Data

```javascript
createApiResponse({
	message: 'A clear description of what succeeded',
	data: { theActualData },
});
```

### When Returning Message Only

```javascript
createApiResponse({
	message: 'A clear description of what succeeded',
});
```

## 2. Error Responses (Status Codes 300+)

Use a direct string message:

```javascript
createApiResponse('A clear description of what went wrong', errorStatusCode);
```

## 3. Specific Patterns

- Always include a descriptive message for successful operations
- Keep error messages concise and descriptive
- Use consistent status codes for similar types of errors
- Data should be structured as an object when including additional information

## 4. Implementation Examples

### Success with Data

```javascript
return createApiResponse({
	message: 'Successfully retrieved crews',
	data: { crews },
});
```

### Success with Message Only

```javascript
return createApiResponse({
	message: `Successfully deleted ${key}`,
});
```

### Error Response

```javascript
return createApiResponse('Missing required parameter: address', 400);
```

## Example Responses

Example Success Response:

```json
{
	"success": true,
	"data": {
		"message": "Successfully retrieved crews",
		"data": {}
	}
}
```

Example Success Response (Message Only):

```json
{
	"success": true,
	"message": "Successfully deleted crew"
}
```

Example Error Response:

```json
{
	"success": false,
	"error": "Missing required parameter: address"
}
```
