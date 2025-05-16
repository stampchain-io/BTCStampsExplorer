# Redis Connection Troubleshooting Log - BTCStampsExplorer

This log tracks the investigation and resolution steps for Redis connectivity issues in the ECS environment.

## Phase 1: Initial AWS Infrastructure & Configuration Review

*   **[COMPLETED]** Reviewed `scripts/update-task-def.sh`: Confirmed it loads ENV VARS from `.env`.
*   **[COMPLETED]** Inspected live ECS Task Definition (`arn:aws:ecs:us-east-1:947253282047:task-definition/stamps-app-service:66` - *Note: This was the version before CACHE=true fix attempt*):
    *   `ELASTICACHE_ENDPOINT`: `stamps-app-cache.ycbgmb.0001.use1.cache.amazonaws.com`
    *   `ELASTICACHE_PORT`: `6379`
    *   `SKIP_REDIS_TLS`: `true` (Matches `REDIS_SETUP.md` recommendation)
    *   `CACHE`: `false` (Identified as highly problematic based on `REDIS_SETUP.md`)
    *   `FORCE_REDIS_CONNECTION`: `true`
*   **[COMPLETED]** Inspected ElastiCache Redis Instance (`stamps-app-cache`):
    *   VPC ID: `vpc-0dc996204c4b28a3f`
    *   Subnets: `subnet-0731f368831419344`, `subnet-04f3ca3e22f793531`
    *   Security Group ID: `sg-0c1ea60980e66ebe4`
    *   Status: `available`, No Auth, No Transit Encryption.
*   **[COMPLETED]** Inspected ECS Service (`stamps-app-service`) Networking:
    *   VPC ID: `vpc-0dc996204c4b28a3f` (Matches ElastiCache)
    *   Subnets: `subnet-0731f368831419344` (Shared with ElastiCache), `subnet-0497bf84dd6ad6c02`
    *   Security Group ID: `sg-0c1ea60980e66ebe4` (Shared with ElastiCache)
*   **[COMPLETED]** Analyzed Security Group `sg-0c1ea60980e66ebe4` Inbound Rules:
    *   Confirmed rule allowing TCP port 6379 from `sg-0c1ea60980e66ebe4` (itself) is present. Network path for Redis seems open at SG level.
*   **[COMPLETED]** Reviewed attached `server/services/cacheService.ts`: Defines cache durations per route type, no direct use of global `CACHE` env var seen.
*   **[COMPLETED]** Reviewed attached `REDIS_SETUP.md`:
    *   **Crucially, this document specifies `CACHE=true` is required.**
    *   Mentions Redis client logic is in `/server/database/databaseManager.ts`.
*   **[IDENTIFIED - USER CONFIRMED]** Root Cause Suspected: `CACHE=false` in `.env` file conflicts with documentation and likely disables Redis connection attempts.

## Phase 2: Remediation & Validation

*   **[COMPLETED - FAILED TO RESOLVE]** User updated `.env` to set `CACHE=true` and redeployed the ECS service via `scripts/update-task-def.sh`.
*   **[OBSERVED]** `[REDIS FALLBACK]` messages continue in CloudWatch logs post-deployment with `CACHE=true`.
*   **[COMPLETED]** Verified current running ECS Task Definition (`arn:aws:ecs:us-east-1:947253282047:task-definition/stamps-app-service:67`) has `CACHE=true` applied.
*   **[USER ACTION COMPLETED]** User set `REDIS_DEBUG=true` (or equivalent `REDIS_LOG_LEVEL: DEBUG`) and redeployed. Current Task Def: `stamps-app-service:68` (assumed).
*   **[OBSERVATION]** Detailed CloudWatch logs (with `REDIS_LOG_LEVEL: DEBUG`) do *not* show any explicit Redis connection attempts or client-level errors (like timeout, connection refused). They show application startup, then the `secp256k1.node not found` error, immediately followed by `[REDIS FALLBACK]` messages.
*   **[HYPOTHESIS]** The application (likely in `databaseManager.ts`) is deciding not to attempt a Redis connection or is failing silently before a specific client error can be logged, despite `CACHE=true` and debug logging being enabled.
*   **[COMPLETED]** Checked Network ACLs for subnets `subnet-0731f368831419344`, `subnet-0497bf84dd6ad6c02`, `subnet-04f3ca3e22f793531`. All use the default NACL (`acl-0e3e3e5331dba56a1`) which allows all traffic. **NACLs are not the issue.**

## Phase 3: Investigating Application Logic (Redis)

*   **[USER ACTION COMPLETED]** User provided content of `server/database/databaseManager.ts`.
*   **[NEW ISSUE IDENTIFIED]** Analysis of `databaseManager.ts` and `main.ts` reveals that `dbManager.initialize()` (which is responsible for initiating the Redis connection) is **never called** after the `dbManager` instance is created. This is the likely reason no Redis connection attempts are being made.
*   **[PENDING - USER ACTION]** Apply fix to `main.ts` to call `await dbManager.initialize()`.
*   **[ON HOLD]** Consider Valkey/alternative solutions.

## Parallel Issue: Build Problem (secp256k1.node)

*   **[NEW ISSUE IDENTIFIED]** CloudWatch logs show `module "/app/build/secp256k1.node" not found`. This is a critical build/packaging error. (See `docs/secp256k1_build_issue.md` for details).
*   **[USER ACTION RECOMMENDED]** Investigate and resolve the `secp256k1.node` build/packaging issue as per `docs/secp256k1_build_issue.md` (can be done in parallel or after Redis is confirmed working). 