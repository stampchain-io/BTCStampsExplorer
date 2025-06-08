# Deployment Issues & Fixes

## Current Issues

### 1. secp256k1.node Module Not Found

**Problem:** The secp256k1 native module isn't being built properly in the Docker container.

**Quick Fix for Existing Deployment:**
Add this environment variable to your stack:
```yaml
- TINY_SECP256K1_WASM=1  # Force WASM fallback instead of native module
```

**Long-term Fix:**
Use the updated `Dockerfile.fixed` which properly builds native dependencies.

### 2. Redis Configuration Mismatch

**Problem:** Your stack uses Redis password but our updated files removed it.

**Fix Applied:** Updated the stack files to include Redis password authentication:
- Added `REDIS_PASSWORD` environment variable
- Updated Redis command to use `--requirepass`
- Fixed health check to use authentication

### 3. Missing Environment Variables

Add these to your stack environment:
```yaml
- ELASTICACHE_ENDPOINT=redis
- REDIS_PASSWORD=your-secure-redis-password
- TINY_SECP256K1_WASM=1
```

## Updated Stack File Features

✅ **Redis with password authentication**
✅ **Proper network configuration** (redis_network + existing networks)  
✅ **Resource limits and logging**
✅ **Health checks with authentication**
✅ **secp256k1 WASM fallback option**

## Build New Image

To fix the secp256k1 issue permanently:

```bash
# Build with fixed Dockerfile
./build-and-push.sh dev

# Or manually:
docker build -f Dockerfile.fixed -t mortylen/btcstampsexplorer:dev .
docker push mortylen/btcstampsexplorer:dev
```

## Environment Variables for Portainer

```bash
# Core
DOMAIN=voxirae.host
DOCKER_IMAGE=mortylen/btcstampsexplorer:dev

# Database  
DB_HOST=mysql1
DB_USER=root
DB_PASSWORD=qA5daNRpuUjWn3
DB_NAME=btc_stamps

# Redis
REDIS_PASSWORD=your-secure-redis-password

# Fix secp256k1 issue
TINY_SECP256K1_WASM=1

# API
API_BASE_URL=https://voxirae.host
QUICKNODE_ENDPOINT=https://your-quicknode-endpoint.com
QUICKNODE_API_KEY=your-quicknode-api-key

# Caching
CACHE=true
ELASTICACHE_ENDPOINT=redis
SKIP_REDIS_CONNECTION=false
```

## Immediate Fix

Add this line to your existing stack's btc-stamps-explorer environment:
```yaml
- TINY_SECP256K1_WASM=1
```

This will force the application to use the WASM version instead of looking for the native module.