# Authentication System Improvements

## Overview

This document outlines improvements to our authentication system while maintaining simplicity and security. The changes focus on standardizing token handling, improving security, and following best practices.

## Key Improvements

1. Bearer Token Format
2. HTTP-Only Secure Cookies
3. Token Rotation (Access + Refresh Tokens)
4. Rate Limiting
5. CSRF Protection

## Implementation Details

### 1. Bearer Token Format

Update the Authorization header handling to use the standard Bearer format:

```typescript
// Before
Authorization: your-token-here

// After
Authorization: Bearer your-token-here
```

### 2. Token Structure

Implement a two-token system:
- Access Token: Short-lived (1 hour)
- Refresh Token: Long-lived (30 days)

```typescript
interface TokenPair {
  accessToken: string;    // 1 hour lifetime
  refreshToken: string;   // 30 days lifetime
}

interface TokenMetadata {
  address: string;
  type: 'access' | 'refresh';
  exp: number;
}
```

### 3. Token Storage

Store tokens in KV with appropriate TTL:

```typescript
// Access token (1 hour)
await kv.put(`auth:access:${accessToken}`, JSON.stringify({
  address,
  type: 'access',
  exp: Date.now() + 3600000
}), { expirationTtl: 3600 });

// Refresh token (30 days)
await kv.put(`auth:refresh:${refreshToken}`, JSON.stringify({
  address,
  type: 'refresh',
  exp: Date.now() + 2592000000
}), { expirationTtl: 2592000 });
```

### 4. Cookie Security

Set secure HTTP-only cookies for both tokens:

```typescript
const setCookieHeaders = {
  'Set-Cookie': [
    `access_token=${accessToken}; HttpOnly; Secure; SameSite=Strict; Max-Age=3600`,
    `refresh_token=${refreshToken}; HttpOnly; Secure; SameSite=Strict; Max-Age=2592000`
  ]
};
```

### 5. Rate Limiting

Implement rate limiting using DurableObject storage:

```typescript
const RATE_LIMIT = {
  WINDOW_MS: 3600000,  // 1 hour
  MAX_ATTEMPTS: 5
};

async function checkRateLimit(address: string): Promise<boolean> {
  const key = `ratelimit:auth:${address}`;
  const attempts = await this.storage.get(key) || 0;
  
  if (attempts >= RATE_LIMIT.MAX_ATTEMPTS) {
    return false;
  }
  
  await this.storage.put(key, attempts + 1, {
    expiration: Date.now() + RATE_LIMIT.WINDOW_MS
  });
  
  return true;
}
```

### 6. CSRF Protection

Add CSRF token validation for sensitive operations:

```typescript
const csrfToken = crypto.randomUUID();
await kv.put(`csrf:${csrfToken}`, address, { 
  expirationTtl: 3600 
});

// Include in response headers
headers['X-CSRF-Token'] = csrfToken;
```

## API Endpoints

### 1. Request Auth Token

```typescript
POST /auth/request-auth-token
Content-Type: application/json
Authorization: Bearer <shared-key>

{
  "signature": "...",
  "publicKey": "..."
}

Response:
{
  "success": true,
  "data": {
    "message": "Authentication successful",
    "address": "ST..."
  }
}
+ Set-Cookie headers
```

### 2. Refresh Token

```typescript
POST /auth/refresh
Cookie: refresh_token=<token>

Response:
{
  "success": true,
  "data": {
    "message": "Token refreshed"
  }
}
+ New Set-Cookie headers
```

### 3. Verify Token

```typescript
POST /auth/verify
Cookie: access_token=<token>

Response:
{
  "success": true,
  "data": {
    "address": "ST...",
    "exp": 1234567890
  }
}
```

### 4. Revoke Token

```typescript
POST /auth/revoke
Cookie: access_token=<token>
X-CSRF-Token: <csrf-token>

Response:
{
  "success": true,
  "data": {
    "message": "Tokens revoked"
  }
}
```

## Migration Steps

1. Update `validateSharedKeyAuth` to handle Bearer format
2. Implement token rotation system
3. Add cookie-based token storage
4. Add rate limiting
5. Add CSRF protection
6. Update existing endpoints to use new token system
7. Add new endpoints (refresh, revoke)

## Security Considerations

1. Always use HTTPS
2. Set appropriate cookie security flags
3. Implement proper error handling
4. Log security-relevant events
5. Regular token cleanup
6. Monitor for suspicious activity

## Testing

1. Test token rotation
2. Verify rate limiting
3. Test CSRF protection
4. Verify cookie security
5. Test token revocation
6. Test error scenarios

## Future Improvements

1. Add token blacklisting
2. Implement device fingerprinting
3. Add audit logging
4. Add automated security monitoring
5. Implement progressive security measures
