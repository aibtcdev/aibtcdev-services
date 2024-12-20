type ApiResponse = {
	success: boolean;
	data?: any;
	error?: string;
};

type ValidationResult = {
	isValid: boolean;
	error?: string;
};

export const standardErrors = {
	METHOD_NOT_ALLOWED: (method: string) => `Method ${method} not allowed`,
	MISSING_PARAMS: (params: string[]) => `Missing required parameters: ${params.join(', ')}`,
	MISSING_FIELDS: (fields: string[]) => `Missing required fields: ${fields.join(', ')}`,
	UNAUTHORIZED: 'Unauthorized access',
	NOT_FOUND: (resource: string) => `${resource} not found`,
	INVALID_INPUT: (details: string) => `Invalid input: ${details}`,
} as const;

export function validateRequiredParams(params: Record<string, string | null>, required: string[]): ValidationResult {
	const missing = required.filter(param => !params[param]);
	return {
		isValid: missing.length === 0,
		error: missing.length ? standardErrors.MISSING_PARAMS(missing) : undefined
	};
}

export function validateRequiredBody<T extends Record<string, any>>(
	body: T,
	required: (keyof T)[]
): ValidationResult {
	const missing = required.filter(field => !body[field]);
	return {
		isValid: missing.length === 0,
		error: missing.length ? standardErrors.MISSING_FIELDS(missing as string[]) : undefined
	};
}

export function validateMethod(request: Request, allowed: string[]): ValidationResult {
	return {
		isValid: allowed.includes(request.method),
		error: !allowed.includes(request.method) ? standardErrors.METHOD_NOT_ALLOWED(request.method) : undefined
	};
}

export function corsHeaders(origin?: string): HeadersInit {
	return {
		'Access-Control-Allow-Origin': origin || '*',
		'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		'Access-Control-Max-Age': '86400',
	};
}

export function createApiResponse(response: { message: string; data?: unknown } | string, status: number = 200): Response {
	const isOk = status >= 200 && status < 300;
	const isStringResponse = typeof response === 'string';

	const responseData = isStringResponse
		? { message: response }
		: { message: response.message, ...(response.data || {}) };

	const responseBody: ApiResponse = {
		success: isOk,
		...(isOk ? { data: responseData } : { error: response as string }),
	};

	return new Response(JSON.stringify(responseBody), {
		status,
		headers: {
			'Content-Type': 'application/json',
			...corsHeaders(),
		},
	});
}

export function createUnsupportedEndpointResponse(endpoint: string, supportedEndpoints: string[]): Response {
	return createApiResponse(`Unsupported endpoint: ${endpoint}, supported endpoints: ${supportedEndpoints.join(', ')}`, 404);
}
