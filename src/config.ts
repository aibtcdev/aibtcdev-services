import { Env } from '../worker-configuration';

/**
 * AppConfig provides centralized configuration management for the application.
 * Uses the singleton pattern to ensure consistent config across all services.
 */
export class AppConfig {
	private static instance: AppConfig;
	private env: Env;

	private constructor(env: Env) {
		this.env = env;
	}

	/**
	 * Get or create the singleton instance
	 * @param env Optional environment variables, required on first call
	 * @throws Error if env not provided on first call
	 */
	public static getInstance(env?: Env): AppConfig {
		if (!AppConfig.instance && env) {
			AppConfig.instance = new AppConfig(env);
		} else if (!AppConfig.instance) {
			throw new Error('AppConfig must be initialized with environment variables first');
		}
		return AppConfig.instance;
	}

	/**
	 * Get the application configuration object
	 * @returns Configuration object with all settings
	 */
	public getConfig() {
		return {
			// List of all supported API service endpoints
			// Used for routing and validation
			SUPPORTED_SERVICES: ['/auth', '/cdn', '/context', '/database', '/scheduler', '/tools', '/image'],

			// Default interval for Durable Object alarm checks
			// Currently set to 8 hours while alarm functionality is in development
			// Individual DOs can override this value as needed
			ALARM_INTERVAL_MS: 28800000,
		};
	}
}
