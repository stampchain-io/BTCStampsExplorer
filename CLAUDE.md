# BTCStampsExplorer - Claude Code 2025 Instructions

## Project Overview

BTCStampsExplorer is the **official Bitcoin Stamps block explorer and API** powering [stampchain.io](https://stampchain.io). This is a production-grade Deno Fresh application serving the Bitcoin Stamps ecosystem with:

- **Fresh Framework**: Server-side rendering + islands architecture for optimal performance
- **API Server**: OpenAPI/Swagger documented endpoints serving Bitcoin Stamps data
- **Database Stack**: MySQL (read-only for security) + Redis caching layer
- **Testing Infrastructure**: Newman API tests, unit tests, integration tests
- **AWS Deployment**: Production CI/CD pipeline with automated rollback capabilities

**Critical Production Context**: This application serves live Bitcoin Stamps data and financial information. All changes must maintain data integrity and security standards.

## Task Master AI Integration

**Import Task Master's development workflow commands and guidelines:**
@./.taskmaster/CLAUDE.md

## Claude Code 2025 Best Practices

### The "Do Not Touch" List (Critical ⚠️)

**Core Infrastructure Files** (never modify without explicit user permission):
- `deno.json` - Deno configuration with complex import maps and tasks
- `deno.lock` - Dependency lockfile (auto-managed by Deno)
- `main.ts` - Application entry point with critical resolver hooks
- `dev.ts` - Development server configuration
- `fresh.gen.ts` - Fresh framework auto-generated routes file
- `schema.yml` - OpenAPI specification (validated in CI)
- `docker-compose.*.yml` - Container orchestration for testing
- `Dockerfile` - Production container configuration
- `.github/workflows/` - Critical CI/CD pipelines
- `.taskmaster/` - Task Master AI files and configurations

**Security & Environment**:
- `.env` files - Never commit, contain database and Redis credentials
- `server/middleware/auth/` - Authentication middleware
- `server/middleware/securityHeaders.ts` - Security headers configuration
- `lib/utils/security/` - Security utility functions
- Database connection files - Read-only access must be preserved

**Fresh Framework Generated/Auto-managed**:
- `_fresh/` directory - Fresh framework internals
- `node_modules/` - Auto-generated (Deno uses this for npm compatibility)
- Routes with `fresh.gen.ts` registration - Managed by Fresh build system

**Production Build Artifacts**:
- `dist/` directory - Build output
- `coverage/` - Test coverage reports  
- `reports/` - Newman test reports
- `tmp/` - Temporary files

### Quality Control Shortcuts

Adapted for Deno Fresh development:

- **QPLAN**: "Analyze deno.json tasks, existing route patterns, and database models before implementing. Check Fresh islands architecture and SSR considerations."
- **QCODE**: "Implement with proper TypeScript types, run `deno task check`, validate OpenAPI schema, test both SSR and client-side functionality"  
- **QCHECK**: "Perform security review focusing on data integrity, caching correctness, API response validation, and Fresh architecture patterns"

### Extended Thinking Triggers

For BTCStampsExplorer's complex blockchain data processing:

- **"think"**: Basic reasoning for simple route or component changes
- **"think hard"**: Deep analysis for database queries, caching strategies, or API design
- **"think harder"**: Complex blockchain data processing, transaction validation, or performance optimization
- **"ultrathink"**: Security-critical changes, database schema impacts, or production deployment decisions

### Custom Slash Commands

**BTCStampsExplorer-specific commands** (use with `/command-name`):

Create `.claude/commands/btc-dev-server.md`:
```markdown
Start BTCStampsExplorer development server with proper setup.

Steps:
1. Check Deno version with `deno --version` (must be 2.4.2+)
2. Validate environment with `deno task check:ports` 
3. Start development server: `deno task dev`
4. Verify server is running on http://localhost:8000
5. Check for any TypeScript errors or warnings
```

Create `.claude/commands/btc-test-api.md`:
```markdown
Run comprehensive API tests for BTCStampsExplorer: $ARGUMENTS

Steps:
1. Validate OpenAPI schema: `deno task test:api:schema`
2. Run smoke tests: `npm run test:api:smoke`
3. Run comprehensive Newman tests: `npm run test:api:comprehensive`
4. If $ARGUMENTS contains "performance": `npm run test:api:performance`
5. Generate test report summary
```

Create `.claude/commands/btc-validate-build.md`:
```markdown
Validate BTCStampsExplorer build and deployment readiness.

Steps:
1. Run full quality checks: `deno task check:all`
2. Run unit tests with coverage: `deno task test:unit:coverage`
3. Build production: `deno task build`
4. Run deployment validation: `deno task deploy:validate`
5. Check for any build warnings or errors
```

Create `.claude/commands/btc-debug-database.md`:
```markdown
Debug database connectivity and query performance.

Steps:
1. Check database connection in server logs
2. Review Redis cache status and hit rates
3. Analyze slow query logs if performance issues
4. Check read-only permissions are properly configured
5. Validate data integrity for recent blocks
```

### Hooks Configuration

Configure in `.claude/settings.json`:

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "command": "bash -c 'if [[ \"$CLAUDE_TOOL\" == \"Write\" && \"$CLAUDE_FILE_PATH\" =~ \\.(ts|tsx|js)$ ]]; then echo \"[DENO PRE-CHECK] Validating TypeScript syntax for $CLAUDE_FILE_PATH\"; deno check \"$CLAUDE_FILE_PATH\" 2>/dev/null || echo \"Warning: TypeScript check failed\"; fi'",
        "description": "Pre-validate TypeScript files before writing"
      }
    ],
    "PostToolUse": [
      {
        "command": "bash -c 'if [[ \"$CLAUDE_TOOL\" == \"Write\" && \"$CLAUDE_FILE_PATH\" =~ routes/.*\\.tsx?$ ]]; then echo \"[FRESH POST-CHECK] Route file modified: $CLAUDE_FILE_PATH\"; deno task check:ssr || echo \"Warning: SSR validation failed\"; fi'",
        "description": "Validate Fresh routes after modification"
      },
      {
        "command": "bash -c 'if [[ \"$CLAUDE_TOOL\" == \"Write\" && \"$CLAUDE_FILE_PATH\" == \"schema.yml\" ]]; then echo \"[OPENAPI POST-CHECK] Schema modified, validating...\"; npm run validate:schema || echo \"Error: OpenAPI schema validation failed\"; fi'",
        "description": "Validate OpenAPI schema after changes"
      }
    ],
    "SessionStart": [
      {
        "command": "echo \"🚀 BTCStampsExplorer Development Session Started\"",
        "description": "Session startup message"
      },
      {
        "command": "bash -c 'if [ -f .env ]; then echo \"✅ Environment configuration found\"; else echo \"⚠️  No .env file - copy from .env.sample if needed\"; fi'",
        "description": "Check environment setup"
      }
    ]
  }
}
```

### Development Workflow Patterns

**Daily Development Cycle**:
```bash
# 1. Start session with environment check
claude  # Hooks will validate environment

# 2. Get next task from Task Master
task-master next

# 3. Standard development cycle
deno task dev                    # Start development server
deno task check                  # Quality validation
deno task test:unit             # Run unit tests
npm run test:api:smoke          # API smoke tests

# 4. Pre-commit validation
deno task validate:quick        # Quick validation
deno task build                 # Ensure build works
```

**Feature Development Pattern**:
```bash
# 1. Plan changes
/btc-validate-build            # Ensure clean starting state

# 2. Implement with validation
# Edit files...
deno task check:imports        # Validate import patterns
deno task check:ssr           # Check SSR compatibility

# 3. Test thoroughly
npm run test:api:comprehensive # Full API test suite
deno task test:unit:coverage  # Unit tests with coverage

# 4. Deploy validation
deno task deploy:pre-flight   # Production readiness check
```

### BTCStampsExplorer Specific Guidelines

#### Fresh Framework Architecture

**Server-Side Rendering (SSR)**:
- Routes in `routes/` directory auto-generate server endpoints
- Islands in `islands/` directory provide client-side interactivity
- Components in `components/` are server-rendered only
- Use `$lib/utils/freshNavigationUtils.ts` for navigation helpers

**Critical SSR Rules**:
- Never use browser-only APIs in route handlers or components
- Use `islands/` for any client-side JavaScript functionality
- Database queries only in route handlers, never in islands
- Validate with `deno task check:ssr` before committing

#### Database and Caching Architecture

**MySQL Database Access**:
- **READ-ONLY access only** - this is critical for security
- Connection pool managed in `server/database/`
- All queries must be parameterized (no string concatenation)
- Use `lib/utils/monitoring/` for query performance tracking

**Redis Caching Strategy**:
- Cache keys follow pattern: `btc:stamps:{type}:{identifier}`
- TTL values configured per endpoint type
- Cache invalidation handled automatically
- Use `server/middleware/cache/` for caching logic

**Performance Requirements**:
- API responses < 500ms (cached) and < 2s (uncached)
- Database queries optimized with proper indexing
- Redis hit ratio > 80% for frequently accessed data
- Monitor with `deno task monitor:memory` for memory leaks

#### API Development Standards

**OpenAPI/Swagger Compliance**:
- All endpoints must be documented in `schema.yml`
- Validate changes with `npm run validate:schema`
- Use typed response utilities from `$lib/utils/apiResponseUtil.ts`
- Version API responses with `$lib/utils/versionedApiResponse.ts`

**Response Structure**:
```typescript
// All API responses should follow this pattern
interface ApiResponse<T> {
  success: boolean;
  data: T;
  meta?: {
    pagination?: PaginationMeta;
    caching?: CacheMeta;
  };
  error?: ApiError;
}
```

**Critical API Routes**:
- `/api/v1/stamps/` - Core stamp data (most critical)
- `/api/v1/src20/` - SRC-20 token endpoints
- `/api/v1/blocks/` - Block explorer functionality
- `/api/health` - System health monitoring

#### Testing Infrastructure

**Newman API Testing**:
```bash
# Test collections in tests/postman/collections/
npm run test:api:smoke           # 3 endpoints, health checks
npm run test:api:comprehensive   # 46 endpoints, full coverage
npm run test:api:performance     # Load testing
npm run test:api:regression      # Dev vs prod validation
```

**Unit and Integration Tests**:
```bash
# Deno testing framework
deno task test:unit              # Unit tests in tests/unit/
deno task test:unit:coverage     # With coverage reports
deno task test:integration       # Database integration tests
```

**Test Environment Requirements**:
- Tests run with `DENO_ENV=test` and `SKIP_REDIS_CONNECTION=true`
- Docker Compose provides isolated Newman test environment
- CI/CD runs full test matrix including cross-browser validation

#### Security and Production Considerations

**Security Headers** (configured in `server/middleware/securityHeaders.ts`):
- Content Security Policy for XSS protection
- HSTS for HTTPS enforcement  
- CORS configured for API access
- Rate limiting on API endpoints

**Data Integrity**:
- All Bitcoin data is read-only from indexer database
- Cache invalidation ensures data freshness
- Transaction signatures validated against Bitcoin network
- Block height consensus verified

**Production Deployment**:
- AWS deployment with automated rollback: `deno task deploy:rollback`
- Performance benchmarking: `deno task deploy:benchmark`
- Regression detection: `deno task deploy:regression`
- Load testing validation before deployment

#### Common Development Patterns

**Route Handler Pattern**:
```typescript
// routes/api/v1/stamps/[id].ts
import { Handlers } from "$fresh/server.ts";
import { getCachedStampData } from "$server/cache/stampCache.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    const { id } = ctx.params;
    const stampData = await getCachedStampData(id);
    
    return Response.json({
      success: true,
      data: stampData,
      meta: { cached: true }
    });
  }
};
```

**Island Component Pattern**:
```typescript
// islands/StampViewer.tsx
import { useSignal } from "@preact/signals";
import { StampData } from "$types/stamps.ts";

export default function StampViewer({ stampId }: { stampId: string }) {
  const loading = useSignal(false);
  // Client-side functionality only
  
  return <div>...</div>;
}
```

**Database Query Pattern**:
```typescript
// lib/database/stampQueries.ts
export async function getStampById(id: string): Promise<StampData | null> {
  const query = `
    SELECT * FROM stamps 
    WHERE stamp_id = ? 
    AND block_index IS NOT NULL
  `;
  
  const [rows] = await db.execute(query, [id]);
  return rows[0] || null;
}
```

### Performance Optimization Guidelines

**Caching Strategy**:
- Static assets cached at CDN level
- API responses cached in Redis with appropriate TTL
- Database query results cached to minimize DB load
- Use `$lib/utils/debounce.ts` for user input processing

**Fresh Framework Optimization**:
- Minimize island JavaScript bundle sizes
- Use server-side rendering for SEO-critical content
- Implement proper hydration boundaries
- Monitor bundle sizes with build output

**Database Performance**:
- Use EXPLAIN ANALYZE for query optimization
- Monitor slow query log and optimize accordingly
- Implement proper indexing for frequently accessed data
- Use connection pooling to manage database connections

### Monitoring and Alerting

**System Monitoring**:
```bash
# Memory monitoring
deno task monitor:memory --url=http://localhost:8000

# Performance monitoring  
deno task deploy:benchmark

# Health checks
curl http://localhost:8000/api/health
```

**Key Metrics to Monitor**:
- API response times and error rates
- Database query performance and connection pool usage
- Redis cache hit ratios and memory usage
- Memory consumption and potential leaks
- SSL certificate expiration and security headers

### Common Gotchas and Solutions

**Deno-Specific Issues**:
- Import maps in `deno.json` are complex - use existing aliases like `$lib/`, `$utils/`
- Node modules compatibility via `node:` prefix imports
- Permission system requires explicit `--allow-` flags
- Use `deno task check_version` to ensure correct Deno version

**Fresh Framework Issues**:
- Islands vs components confusion - use islands for client-side functionality only
- SSR hydration mismatches - validate with `deno task check:ssr`
- Route parameter extraction - use `ctx.params` correctly
- Static file serving from `static/` directory

**Bitcoin Stamps Specific**:
- Transaction validation requires proper secp256k1 handling
- Block height consensus critical for data integrity  
- SRC-20 token balance calculations must be precise
- Image protocol data requires special base64 handling

### Troubleshooting Commands

**Development Issues**:
```bash
# Kill stuck servers
deno task kill

# Clean restart
deno task dev:clean

# Check port conflicts
deno task check:ports

# Validate all systems
deno task validate:quick
```

**Production Issues**:
```bash
# Check deployment readiness
deno task deploy:validate

# Run regression tests
deno task deploy:regression

# Monitor system performance
deno task monitor:memory

# Rollback if needed
deno task deploy:rollback --check
```

## Advanced Claude Code Features

### MCP Integration

BTCStampsExplorer can integrate with MCP servers for enhanced development workflow:

```json
{
  "mcpServers": {
    "task-master-ai": {
      "command": "npx",
      "args": ["-y", "--package=task-master-ai", "task-master-ai"],
      "env": {
        "ANTHROPIC_API_KEY": "your_key_here"
      }
    }
  }
}
```

### Status Line Configuration

Add to `.claude/settings.json` for enhanced development experience:

```json
{
  "statusLine": {
    "command": "bash -c 'echo \"🟢 Deno $(deno --version | head -1 | cut -d\" \" -f2) | Branch: $(git branch --show-current 2>/dev/null || echo \"none\") | Ports: $(lsof -ti:8000 >/dev/null && echo \"8000✓\" || echo \"8000✗\")\"'",
    "refreshIntervalSeconds": 5
  }
}
```

### Tool Allowlist

Configure safe tool usage in `.claude/settings.json`:

```json
{
  "allowedTools": [
    "Read",
    "Write",
    "Bash(deno task *)",
    "Bash(npm run test:*)",
    "Bash(task-master *)",
    "Bash(git *)",
    "Bash(curl -X GET *)",
    "mcp__task_master_ai__*"
  ],
  "deniedTools": [
    "Bash(rm -rf *)",
    "Bash(sudo *)",
    "Bash(DROP *)",
    "Bash(*--force*)"
  ]
}
```

## Critical Production Notes

**Data Integrity**: BTCStampsExplorer serves financial data for Bitcoin Stamps ecosystem. All changes must preserve data accuracy and system security.

**High Availability**: The application serves [stampchain.io](https://stampchain.io) with uptime requirements. Test thoroughly before deployment.

**Community Impact**: Changes affect Bitcoin Stamps community members and their digital assets. Maintain backward compatibility and clear communication.

**Security First**: Database access is read-only by design. Never modify transaction data, only display and analyze it.

---

**Remember**: BTCStampsExplorer is critical infrastructure for the Bitcoin Stamps ecosystem. Every change should prioritize data integrity, security, and community needs while maintaining the high technical standards expected of financial software.

*Building the future of Bitcoin Stamps, one commit at a time* 🧡