# Deployment Runbook: ARM64 Migration + Cloudflare Browser Rendering

## Overview

This deployment migrates ECS from x86 to ARM64 (Graviton) and offloads Chrome rendering
to Cloudflare Browser Rendering Workers. Estimated savings: ~37% on ECS costs.

## Prerequisites

- AWS CLI configured with appropriate IAM permissions
- Cloudflare account with Workers Paid plan (Browser Rendering included)
- `wrangler` CLI installed (`npm i -g wrangler`)
- Access to CodeBuild project `stamps-app-build`

---

## Phase 0: ARM64 Migration

### 1. Update CodeBuild to ARM64 compute

```bash
# Update CodeBuild project to use ARM64 compute type
aws codebuild update-project \
  --name stamps-app-build \
  --environment '{
    "type": "ARM_CONTAINER",
    "image": "aws/codebuild/amazonlinux2-aarch64-standard:3.0",
    "computeType": "BUILD_GENERAL1_SMALL",
    "privilegedMode": true
  }'
```

### 2. Register new ARM64 ECS task definition

```bash
# Get current task definition
aws ecs describe-task-definition \
  --task-definition stamps-app-task \
  --query 'taskDefinition' > /tmp/current-task-def.json

# Create new task definition with ARM64
# Edit the JSON to add:
#   "runtimePlatform": {
#     "cpuArchitecture": "ARM64",
#     "operatingSystemFamily": "LINUX"
#   }
# Then register:
aws ecs register-task-definition --cli-input-json file:///tmp/arm64-task-def.json
```

### 3. Trigger build and deploy

```bash
# The buildspec.yml changes are already in the branch
# Trigger CodeBuild
aws codebuild start-build --project-name stamps-app-build

# Monitor build
aws codebuild batch-get-builds --ids <build-id> --query 'builds[0].buildStatus'
```

### 4. Verify ARM64 deployment

```bash
# Check ECS service is stable
aws ecs describe-services \
  --cluster stamps-app-prod \
  --services stamps-app-service \
  --query 'services[0].{status:status,running:runningCount,desired:desiredCount}'

# Verify the running tasks use ARM64
aws ecs describe-tasks \
  --cluster stamps-app-prod \
  --tasks $(aws ecs list-tasks --cluster stamps-app-prod --service stamps-app-service --query 'taskArns[0]' --output text) \
  --query 'tasks[0].cpu'

# Run Newman smoke tests against production
curl -s https://stampchain.io/api/health | jq .

# Test preview endpoint
curl -sI "https://stampchain.io/api/v2/stamp/1054189/preview" | grep -E "HTTP|Content-Type|X-"
```

### Rollback (Phase 0)

```bash
# Revert CodeBuild to x86
aws codebuild update-project \
  --name stamps-app-build \
  --environment '{
    "type": "LINUX_CONTAINER",
    "image": "aws/codebuild/standard:7.0",
    "computeType": "BUILD_GENERAL1_SMALL",
    "privilegedMode": true
  }'

# Re-register the previous x86 task definition
aws ecs update-service \
  --cluster stamps-app-prod \
  --service stamps-app-service \
  --task-definition stamps-app-task:<previous-revision>

# Trigger rebuild with x86
aws codebuild start-build --project-name stamps-app-build
```

---

## Phase 1b: Deploy Cloudflare Worker

### 1. Deploy the Worker

```bash
cd workers/preview-renderer/
npm install

# Set the shared secret
wrangler secret put PREVIEW_AUTH_SECRET
# Enter a strong random secret (e.g., openssl rand -hex 32)

# Deploy
wrangler deploy
```

### 2. Note the Worker URL

After deployment, Wrangler outputs the Worker URL:
```
Published stamp-preview-renderer (X.XX sec)
  https://stamp-preview-renderer.<your-subdomain>.workers.dev
```

### 3. Test the Worker directly

```bash
WORKER_URL="https://stamp-preview-renderer.<subdomain>.workers.dev"
SECRET="<your-secret>"

# Test URL mode (SVG)
curl -s -X POST "$WORKER_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SECRET" \
  -d '{"url":"https://stampchain.io/stamps/test.svg","viewport":{"width":1200,"height":1200},"delay":2000}' \
  -o test-output.png

# Test HTML mode
curl -s -X POST "$WORKER_URL" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $SECRET" \
  -d '{"html":"<html><body><h1>Test</h1></body></html>","viewport":{"width":1200,"height":1200},"delay":1000}' \
  -o test-html-output.png

# Verify outputs are valid PNGs
file test-output.png test-html-output.png
```

---

## Phase 2: Enable CF Worker in ECS

### 1. Add environment variables to ECS task definition

```bash
# Get current task definition and add these environment variables:
# CF_PREVIEW_WORKER_URL = https://stamp-preview-renderer.<subdomain>.workers.dev
# CF_PREVIEW_WORKER_SECRET = <same secret from Phase 1b>

# Register updated task definition
aws ecs register-task-definition --cli-input-json file:///tmp/task-def-with-cf.json

# Update service to use new task definition
aws ecs update-service \
  --cluster stamps-app-prod \
  --service stamps-app-service \
  --task-definition stamps-app-task:<new-revision>
```

### 2. Verify CF Worker integration

```bash
# Test HTML stamp preview (should show X-Rendering-Engine: cloudflare-worker)
curl -sI "https://stampchain.io/api/v2/stamp/1054189/preview?refresh=true" | grep -E "X-Rendering-Engine|X-Conversion-Method"

# Test SVG foreignObject stamp
curl -sI "https://stampchain.io/api/v2/stamp/<foreignobject-stamp>/preview?refresh=true" | grep "X-Rendering-Engine"

# Check ECS logs for CF Worker usage
aws logs filter-log-events \
  --log-group-name /ecs/stamps-app \
  --filter-pattern "CF Worker" \
  --limit 20
```

### 3. Monitor for 48+ hours

Key metrics to watch:
- `X-Rendering-Engine` header values in access logs (should be `cloudflare-worker`)
- CF Worker error rate in Cloudflare dashboard
- Preview endpoint response times
- Redis cache hit/miss ratio (should be high for stamps already cached)
- ECS container CPU/memory utilization

```bash
# Quick health check script
while true; do
  echo "$(date): $(curl -sI 'https://stampchain.io/api/v2/stamp/1054189/preview' | grep 'X-Rendering-Engine')"
  sleep 300
done
```

---

## Phase 3: Chromium Removal (AFTER 48hr stability)

**PRECONDITION**: Phase 2 must be stable for 48+ hours with zero CF Worker failures.

This is a separate PR. Changes:

1. **Dockerfile**: Remove Chromium packages, PUPPETEER env vars, libgcc override
2. **preview.ts**: Remove local Chrome fallback paths
3. **ECS Task Definition**: Reduce memory from 2048MB to 1024MB (or 1536MB for safety margin)

### Rollback (Phase 3)

If issues arise after Chromium removal:
1. Revert Dockerfile to include Chromium
2. Re-register ECS task definition with 2048MB memory
3. Trigger rebuild — local Chrome fallback automatically re-enables

---

## Environment Variables Reference

| Variable | Where | Value |
|----------|-------|-------|
| `CF_PREVIEW_WORKER_URL` | ECS Task Definition | `https://stamp-preview-renderer.<subdomain>.workers.dev` |
| `CF_PREVIEW_WORKER_SECRET` | ECS Task Definition (secret) | Shared secret matching Worker's `PREVIEW_AUTH_SECRET` |
| `PREVIEW_AUTH_SECRET` | Cloudflare Worker Secret | Same value as `CF_PREVIEW_WORKER_SECRET` |

## Cost Impact Summary

| Item | Before | After (Phase 0+2) | After (Phase 3) |
|------|--------|-------|---------|
| ECS vCPU | $23.67/mo (x86) | $18.94/mo (ARM64) | $18.94/mo |
| ECS Memory | $18.29/mo (2GB x86) | $14.63/mo (2GB ARM64) | $7.32/mo (1GB ARM64) |
| CF Browser Rendering | $0 | $0 (included in plan) | $0 |
| Docker image size | ~477MB | ~477MB | ~150MB |
| **Total ECS** | **$41.96/mo** | **$33.57/mo (20%)** | **$26.26/mo (37%)** |
