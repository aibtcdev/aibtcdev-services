# Durable Objects

This directory contains Cloudflare Durable Object implementations that provide stateful services for the application.

## Common Features

All Durable Objects share these common patterns:

- Constructor initializes with DurableObjectState and Env
- Alarm handling for periodic tasks
- Base path routing with supported endpoints
- Standard error handling and response formatting

## Objects Overview

- **AuthDO**: Handles authentication flows and session management
- **CdnDO**: Manages R2 bucket operations for content delivery
- **DatabaseDO**: Manages database operations and queries
- - 🚧 **ContextDO**: Provides transformed data as API endpoints
- 🚧 **SchedulerDO**: Handles scheduling and execution of backend jobs
- 🚧 **ToolsDO**: Runs TypeScript tools requested by the backend

## Usage

Each Durable Object is bound to a specific namespace in the worker configuration and can be accessed through that binding.

Example:

```typescript
// Get Auth DO stub
const id = env.AUTH_DO.idFromName('auth');
const stub = env.AUTH_DO.get(id);
// Make request to DO
const response = await stub.fetch(request);
```
