# Security Configuration Variables

This document outlines security-related environment variables for the BTC Stamps Explorer application.

## CONNECTION_POOL_RESET_TOKEN

**Purpose**: Secure token required to access the emergency connection pool reset endpoint at `/api/internal/reset-connection-pool`

**Usage**: 
- POST requests to reset the connection pool require `x-reset-token` header with this value
- GET requests to check pool status require trusted origin validation only

**Generation**:
```bash
# Generate a secure random token
openssl rand -hex 32
```

**Configuration**:

### Local Development (.env)
```bash
CONNECTION_POOL_RESET_TOKEN=your-secure-token-here
```

### Production (ECS Task Definition)
Add to container environment variables:
```json
{
  "name": "CONNECTION_POOL_RESET_TOKEN",
  "value": "your-production-secure-token"
}
```

### AWS Secrets Manager (Recommended for Production)
```bash
aws secretsmanager create-secret \
  --name stamps-app/connection-pool-reset-token \
  --secret-string "your-secure-token"
```

Then reference in ECS task definition:
```json
{
  "name": "CONNECTION_POOL_RESET_TOKEN",
  "valueFrom": "arn:aws:secretsmanager:region:account:secret:stamps-app/connection-pool-reset-token"
}
```

## Emergency Usage

To reset the connection pool in production:

```bash
curl -X POST https://stampchain.io/api/internal/reset-connection-pool \
  -H "x-reset-token: YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json"
```

To check pool status:
```bash
curl -X GET https://stampchain.io/api/internal/reset-connection-pool
```

## Security Best Practices

1. **Token Rotation**: Rotate the token periodically (e.g., monthly)
2. **Access Logging**: Monitor CloudWatch logs for usage of this endpoint
3. **Restricted Access**: Only share token with authorized personnel
4. **Use Secrets Manager**: Store production tokens in AWS Secrets Manager, not in plain text

## Related Files

- `/routes/api/internal/reset-connection-pool.ts` - Endpoint implementation
- `/server/database/databaseManager.ts` - Connection pool reset logic
- `.env.sample` - Sample environment variable documentation