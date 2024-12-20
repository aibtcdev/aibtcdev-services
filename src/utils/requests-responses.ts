type ApiResponse = {
	success: boolean;
	data?: any;
	error?: string;
};

export function corsHeaders(origin?: string): HeadersInit {
	return {
		'Access-Control-Allow-Origin': origin || '*',
		'Access-Control-Allow-Methods': 'GET, HEAD, POST, OPTIONS',
		'Access-Control-Allow-Headers': 'Content-Type, Authorization',
		'Access-Control-Max-Age': '86400',
	};
}

export function createApiResponse(response: { message: string; data?: Record<string, unknown> } | string, status: number = 200): Response {
	const isOk = status >= 200 && status < 300;
	const responseBody: ApiResponse = {
		success: isOk,
		...(isOk
			? {
					data: typeof response === 'string' ? { message: response } : { message: response.message, ...(response.data || {}) },
			  }
			: { error: response as string }),
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
