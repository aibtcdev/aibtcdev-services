import { Env } from '../worker-configuration';

export class AppConfig {
	private static instance: AppConfig;
	private env: Env;

	private constructor(env: Env) {
		this.env = env;
	}

	public static getInstance(env?: Env): AppConfig {
		if (!AppConfig.instance && env) {
			AppConfig.instance = new AppConfig(env);
		} else if (!AppConfig.instance) {
			throw new Error('AppConfig must be initialized with environment variables first');
		}
		return AppConfig.instance;
	}

	public getConfig() {
		return {
			// supported services for API endpoints
			SUPPORTED_SERVICES: ['/auth', '/context', '/database', '/scheduler', '/tools'],
			// default interval for DO alarms
			ALARM_INTERVAL_MS: 300000, // 5 minutes
		};
	}
}
