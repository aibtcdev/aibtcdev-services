# Configuration

This directory contains application configuration management.

## Files

- **config.ts**: Singleton configuration class that provides access to app-wide settings

## Usage

The AppConfig class follows the singleton pattern and must be initialized with environment variables:

```typescript
// Initialize with env
const config = AppConfig.getInstance(env);

// Get config values
const settings = config.getConfig();
```

Configuration values are centralized here to avoid hard-coding throughout the application.
