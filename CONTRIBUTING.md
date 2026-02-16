# Contributing to stampchain.io

Thank you for your interest in contributing to stampchain.io! This guide will help you understand our development workflow, coding standards, and quality requirements.

## Quick Start

1. **Fork and clone the repository**
2. **Install dependencies**: `deno install` (if using external dependencies)
3. **Install Git hooks**: `./scripts/install-git-hooks.sh`
4. **Verify setup**: `deno task validate`

## Development Workflow

### Pre-commit Requirements

Our automated pre-commit hooks enforce several quality standards:

- **Code formatting**: `deno fmt --check`
- **Linting**: `deno lint --quiet`  
- **Type checking**: `deno check main.ts`
- **Import pattern validation**: `deno task check:imports:ci`

Install hooks with:
```bash
./scripts/install-git-hooks.sh
```

### Import Pattern Standards

stampchain.io enforces strict import patterns to maintain code quality and architectural consistency.

#### ✅ Preferred Patterns (Use These)

```typescript
// Domain-specific aliases (strongly preferred)
import type { StampData } from "$types/api.d.ts";
import { formatCurrency } from "$utils/formatUtils.ts";
import { StampService } from "$server/services/stampService.ts";

// External dependencies
import { serve } from "$fresh/server.ts";
import dayjs from "dayjs";
```

#### ❌ Deprecated Patterns (Avoid These)

```typescript
// CRITICAL: Will fail CI
import type { StampData } from "$globals";

// WARNING: Discouraged 
import { formatCurrency } from "../../lib/utils/formatUtils.ts";
```

**Important**: The CI system will automatically reject pull requests with critical import pattern violations.

See [docs/IMPORT_PATTERNS.md](docs/IMPORT_PATTERNS.md) for complete guidelines.

### Local Development Commands

```bash
# Development server
deno task dev

# Code quality checks
deno task validate          # Format, check, and test
deno task validate:ci       # CI-style validation (includes import patterns)
deno task check:imports     # Import pattern validation only

# Testing
deno task test:unit         # Unit tests
deno task test:integration  # Integration tests
deno task test:api          # API tests with Newman
```

## Code Quality Standards

### TypeScript Requirements

- **Strict mode enabled**: All code must pass `deno check`
- **Explicit types**: Prefer explicit type annotations
- **No `any` types**: Use proper typing or `unknown`
- **Optional properties**: Use exact syntax (`property?: Type`)

### Import Organization

Organize imports in this order:

1. **External dependencies** (Deno standard library, npm packages)
2. **Framework imports** (Fresh, Preact)
3. **Domain imports** (Using $aliases)
4. **Relative imports** (Same directory only)

Example:
```typescript
// External dependencies
import { assertEquals } from "@std/assert";
import dayjs from "dayjs";

// Framework
import { Head } from "$fresh/runtime.ts";
import { PageProps } from "$fresh/server.ts";

// Domain imports  
import type { StampData } from "$types/api.d.ts";
import { formatCurrency } from "$utils/formatUtils.ts";
import { StampService } from "$server/services/stampService.ts";

// Same directory
import { helper } from "./helper.ts";
```

### File Organization

Follow the established directory structure:

```
├── client/           # Client-side utilities and hooks
├── components/       # Reusable UI components
├── islands/          # Interactive Preact components  
├── lib/
│   ├── constants/    # Application constants
│   ├── types/        # TypeScript type definitions
│   └── utils/        # Utility functions (organized by domain)
├── routes/           # Fresh routes and API endpoints
├── server/           # Server-side logic
│   ├── controller/   # API controllers
│   ├── database/     # Database access layer
│   ├── services/     # Business logic services
│   └── types/        # Server-specific types
└── tests/            # Test files
```

## Submitting Changes

### Pull Request Process

1. **Create feature branch**: `git checkout -b feature/description`
2. **Make changes** following coding standards
3. **Run validation**: `deno task validate:ci`
4. **Commit with clear messages** (see template in `.gitmessage`)
5. **Push and create PR**

### PR Requirements

All pull requests must pass:

- ✅ **Code formatting** (`deno fmt --check`)
- ✅ **Linting** (`deno lint`)
- ✅ **Type checking** (`deno check`)
- ✅ **Import pattern validation** (no $globals imports)
- ✅ **Unit tests** (`deno task test:unit`)
- ✅ **Integration tests** (for API changes)

### Commit Message Format

Use the conventional commit format:

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

Examples:
```
feat(stamps): add new stamp validation endpoint
fix(api): resolve type error in SRC20 balance calculation  
docs(import): update import pattern guidelines
refactor(types): migrate from $globals to domain imports
```

## Testing Requirements

### Unit Tests

- **Location**: `tests/unit/`
- **Command**: `deno task test:unit`
- **Coverage**: Aim for >80% coverage on new code
- **Mocking**: Use test doubles for external dependencies

### Integration Tests

- **Location**: `tests/integration/`
- **Command**: `deno task test:integration`
- **Database**: Use test database with fixtures
- **API**: Test actual HTTP endpoints

### API Tests

- **Tool**: Newman (Postman CLI)
- **Command**: `deno task test:api`
- **Coverage**: All public API endpoints
- **Environments**: Development and staging

## Common Issues

### Import Pattern Violations

If CI fails with import pattern violations:

1. **Run local validation**: `deno task check:imports`
2. **See detailed output**: Check console for specific files and lines
3. **Fix violations**: Replace $globals imports with domain aliases
4. **Verify fix**: `deno task check:imports:ci`

### Type Errors

For TypeScript errors:

1. **Check types**: `deno check main.ts`
2. **Update imports**: Ensure proper type imports from `$types/`
3. **Fix strict mode issues**: Address any `undefined` or `any` types

### Pre-commit Hook Failures

If hooks prevent commits:

1. **Run validation locally**: `deno task validate:ci`
2. **Fix all issues** before attempting commit
3. **Emergency bypass**: `git commit --no-verify` (not recommended)

## Performance Considerations

### Import Performance

- **Prefer aliases**: Use `$utils/formatUtils.ts` over relative paths
- **Avoid deep imports**: Don't import from nested barrel exports
- **Tree shaking**: Explicit imports help bundling optimization

### Code Performance

- **Lazy loading**: Use dynamic imports for large dependencies
- **Preact optimization**: Follow Fresh performance guidelines
- **Database queries**: Optimize with indexes and caching

## Architecture Guidelines

### Domain Separation

stampchain.io follows domain-specific architecture:

- **Types**: Domain-specific type definitions in `lib/types/`
- **Services**: Business logic separated by domain (stamps, SRC20, etc.)
- **Controllers**: Thin API layer delegating to services
- **Components**: Reusable UI components with clear interfaces

### Data Flow

```
Client Request → Route → Controller → Service → Repository → Database
                   ↓
Client Response ← API Response ← Business Logic ← Data Access
```

### Error Handling

- **API errors**: Use structured error responses
- **Client errors**: Graceful degradation with user-friendly messages
- **Logging**: Comprehensive logging for debugging

## Getting Help

### Resources

- **Import patterns**: [docs/IMPORT_PATTERNS.md](docs/IMPORT_PATTERNS.md)
- **API documentation**: Generated Swagger/OpenAPI docs
- **Architecture decisions**: Check Git history and PR discussions

### Communication

- **Issues**: GitHub Issues for bugs and feature requests
- **Discussions**: GitHub Discussions for questions
- **Pull requests**: Code review and feedback

### Local Development Help

```bash
# Check current setup
deno task validate

# Test import patterns
deno task check:imports

# Run specific test suites
deno task test:unit
deno task test:api

# Performance profiling
deno task monitor:local
```

## Release Process

### Version Management

stampchain.io uses semantic versioning:

- **Major**: Breaking API changes
- **Minor**: New features, backward compatible
- **Patch**: Bug fixes, no API changes

### Deployment Pipeline

1. **Development**: Feature branches and PRs
2. **Staging**: Integration testing on staging environment
3. **Production**: Automated deployment after approval

### Quality Gates

Each deployment must pass:

- ✅ All automated tests
- ✅ Import pattern validation
- ✅ Performance benchmarks  
- ✅ Security scans
- ✅ Manual QA approval

---

Thank you for contributing to stampchain.io! Your adherence to these guidelines helps maintain code quality and ensures a smooth development experience for everyone.