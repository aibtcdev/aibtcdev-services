# Utilities

This directory contains shared utility functions used across the application.

## Modules

- **auth-helper.ts**: Authentication utilities for validating shared keys and session tokens
- **requests-responses.ts**: Standard HTTP response formatting and CORS handling
- **stacks.ts**: Types and utilities for Stacks blockchain integration

## Usage

Import utilities as needed:

```typescript
import { createJsonResponse } from './utils/requests-responses';
import { validateSharedKeyAuth } from './utils/auth-helper';
```

The utilities are designed to be simple, pure functions that handle common tasks consistently across the application.
