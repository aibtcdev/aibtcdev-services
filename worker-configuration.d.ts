// Generated by Wrangler by running `wrangler types`

export interface Env {
	AIBTCDEV_SERVICES_KV: KVNamespace;
	AUTH_DO: DurableObjectNamespace<import('./src/index').AuthDO>;
	CONTEXT_DO: DurableObjectNamespace<import('./src/index').ContextDO>;
	DATABASE_DO: DurableObjectNamespace<import('./src/index').DatabaseDO>;
	SCHEDULER_DO: DurableObjectNamespace<import('./src/index').SchedulerDO>;
	TOOLS_DO: DurableObjectNamespace<import('./src/index').ToolsDO>;
}
