# Backward Compatibility Re-exports Migration Timeline

## Overview

This document outlines the gradual removal plan for backward compatibility re-exports in `globals.d.ts`. These re-exports were implemented as part of Task 24 to ensure zero breaking changes during the type domain migration.

## Current Status

- **Implementation Date**: August 1, 2025
- **Re-exports Added**: 74 types across 12 domain modules
- **Target Removal**: v2.0.0 (Q2 2025)
- **Current Coverage**: 100% of previously global types

## Migration Timeline

### Phase 1: Deprecation Announcement (August 2025)
**Duration**: 1 month
**Status**: ✅ Complete

- [x] Add `@deprecated` JSDoc tags to all re-exports
- [x] Include migration instructions in deprecation messages
- [x] Update documentation to recommend domain-specific imports
- [x] Add TypeScript compiler warnings for deprecated usage

**Deprecation Message Format**:
```typescript
/**
 * @deprecated Use `import type { TypeName } from "./lib/types/domain.d.ts";` instead.
 * This global re-export will be removed in v2.0.0 (Q2 2025).
 * @since 1.4.0
 */
```

### Phase 2: Community Notice & Migration Tools (September 2025)
**Duration**: 2 weeks

- [ ] Publish migration guide in project documentation
- [ ] Create automated migration script (`scripts/migrate-type-imports.ts`)
- [ ] Send deprecation notice to community/API consumers
- [ ] Update examples and tutorials to use new import paths

**Migration Script Features**:
- Automatically update import statements
- Generate migration report
- Preserve code formatting
- Handle edge cases and conflicts

### Phase 3: Internal Codebase Migration (October 2025)
**Duration**: 3 weeks

- [ ] Migrate all first-party code to domain-specific imports
- [ ] Update component examples and demos
- [ ] Refactor tests to use new import patterns
- [ ] Validate no performance regressions

**Migration Order**:
1. Core infrastructure files
2. Server-side code
3. Client-side components
4. Test files and examples

### Phase 4: Extended Deprecation Period (November 2025 - January 2026)
**Duration**: 3 months

- [ ] Monitor usage analytics for global imports
- [ ] Provide migration support to community
- [ ] Address compatibility issues as they arise
- [ ] Collect feedback on new import structure

**Support Activities**:
- Discord/GitHub support for migration questions
- Blog posts with migration best practices
- Video tutorials for complex migration scenarios

### Phase 5: Pre-removal Warning (February 2026)
**Duration**: 1 month

- [ ] Escalate deprecation warnings to errors in development
- [ ] Send final removal notice to community
- [ ] Update changelog with removal timeline
- [ ] Prepare rollback plan if needed

**Developer Experience**:
- TypeScript errors for global imports in strict mode
- Runtime warnings in development builds
- Clear error messages with migration instructions

### Phase 6: Re-export Removal (March 2026)
**Duration**: 1 week

- [ ] Remove all backward compatibility re-exports
- [ ] Update `globals.d.ts` to only contain global declarations
- [ ] Release v2.0.0 with breaking changes
- [ ] Update semantic versioning for major release

**Final `globals.d.ts` Structure**:
```typescript
declare global {
  interface GlobalThis {
    SKIP_REDIS_CONNECTION: boolean | undefined;
    DENO_BUILD_MODE: boolean | undefined;
    // ... other global runtime declarations
  }
}

declare namespace NodeJS {
  interface ProcessEnv {
    DENO_ENV?: "development" | "production" | "test";
    // ... environment variable declarations
  }
}

export {};
```

## Domain-Specific Import Mapping

### Base Bitcoin Types
```typescript
// Old (deprecated)
import type { UTXO, TransactionInput } from "./globals.d.ts";

// New (recommended)
import type { UTXO, TransactionInput } from "./lib/types/base.d.ts";
```

### Stamp Protocol Types
```typescript
// Old (deprecated)
import type { StampRow, StampRarity } from "./globals.d.ts";

// New (recommended)
import type { StampRow, StampRarity } from "./lib/types/stamp.d.ts";
```

### SRC-20 Token Types
```typescript
// Old (deprecated)
import type { SRC20Row, SRC20Balance } from "./globals.d.ts";

// New (recommended)
import type { SRC20Row, SRC20Balance } from "./lib/types/src20.d.ts";
```

### Wallet & Transaction Types
```typescript
// Old (deprecated)
import type { WalletStampWithValue, TransactionRow } from "./globals.d.ts";

// New (recommended)
import type { WalletStampWithValue } from "./lib/types/wallet.d.ts";
import type { TransactionRow } from "./lib/types/transaction.d.ts";
```

### API & Response Types
```typescript
// Old (deprecated)
import type { ApiResponse, PaginatedStampResponseBody } from "./globals.d.ts";

// New (recommended)
import type { ApiResponse } from "./lib/types/api.d.ts";
import type { PaginatedStampResponseBody } from "./lib/types/stamp.d.ts";
```

### UI Component Types
```typescript
// Old (deprecated)
import type { ButtonVariant, StampGalleryProps } from "./globals.d.ts";

// New (recommended)
import type { ButtonVariant } from "./lib/types/ui.d.ts";
import type { StampGalleryProps } from "./lib/types/stamp.d.ts";
```

## Migration Support Tools

### Automated Migration Script
```bash
# Run migration script
deno run --allow-read --allow-write scripts/migrate-type-imports.ts

# Options
--dry-run          # Preview changes without applying
--pattern="*.ts"   # Target specific file patterns
--exclude="tests/" # Exclude directories
--backup          # Create backup files
```

### Manual Migration Checklist

For each file requiring migration:

1. **Identify Global Imports**:
   ```bash
   grep -n "from.*globals\.d\.ts" your-file.ts
   ```

2. **Group by Domain**:
   - Base types → `./lib/types/base.d.ts`
   - Stamp types → `./lib/types/stamp.d.ts`
   - SRC-20 types → `./lib/types/src20.d.ts`
   - Wallet types → `./lib/types/wallet.d.ts`
   - API types → `./lib/types/api.d.ts`
   - UI types → `./lib/types/ui.d.ts`

3. **Update Import Statements**:
   ```typescript
   // Replace single global import
   import type { StampRow } from "./globals.d.ts";
   // With domain-specific import
   import type { StampRow } from "./lib/types/stamp.d.ts";

   // Replace multi-type global import
   import type { StampRow, SRC20Row, ApiResponse } from "./globals.d.ts";
   // With multiple domain imports
   import type { StampRow } from "./lib/types/stamp.d.ts";
   import type { SRC20Row } from "./lib/types/src20.d.ts";
   import type { ApiResponse } from "./lib/types/api.d.ts";
   ```

4. **Verify Type Resolution**:
   ```bash
   deno check your-file.ts
   ```

### Migration Validation

After migration, ensure:

- [ ] All TypeScript compilation errors resolved
- [ ] No runtime type errors
- [ ] Import statements follow project conventions
- [ ] No circular dependencies introduced
- [ ] Performance benchmarks maintained

## Risk Mitigation

### Rollback Strategy

If critical issues arise during removal:

1. **Emergency Rollback**: Restore re-exports from backup
2. **Hotfix Release**: Patch critical breaking changes
3. **Extended Timeline**: Delay removal by 3-6 months
4. **Community Support**: Provide migration assistance

### Monitoring & Analytics

Track migration progress through:

- TypeScript compiler warnings/errors
- Bundle analyzer for unused imports
- Community feedback and issue reports
- Performance metrics before/after migration

### Compatibility Layers

For external integrations requiring longer migration periods:

- Maintain separate compatibility package
- Provide adapter functions for breaking changes
- Document upgrade path clearly
- Offer migration consulting for enterprise users

## Benefits After Migration

### Developer Experience
- **Focused IntelliSense**: Only relevant types suggested
- **Faster Type Checking**: Smaller dependency graphs
- **Clearer Dependencies**: Explicit domain boundaries
- **Better Documentation**: Domain-specific type docs

### Codebase Health
- **Reduced Bundle Size**: Eliminate unused type imports
- **Improved Build Times**: Parallel type checking per domain
- **Easier Maintenance**: Changes scoped to domains
- **Better Testing**: Domain-specific type validation

### Team Collaboration
- **Clear Ownership**: Teams own specific type domains
- **Reduced Conflicts**: Less overlap in type definitions
- **Easier Reviews**: Focused type changes
- **Better Onboarding**: Domain-specific learning paths

## Success Metrics

- [ ] **Zero Runtime Errors**: No type-related production issues
- [ ] **Complete Migration**: All code uses domain imports
- [ ] **Community Adoption**: >95% of users migrated
- [ ] **Performance Maintained**: No regressions in build times
- [ ] **Developer Satisfaction**: Positive feedback on new structure

## Communication Plan

### Documentation Updates
- Update README with new import patterns
- Create migration FAQ
- Update API documentation
- Record video tutorials

### Community Outreach
- Discord announcements
- GitHub issue template for migration help
- Blog post series on type organization
- Conference talks on type architecture

### Stakeholder Communication
- Email notifications for major milestones
- Slack updates for internal teams
- Dashboard tracking migration progress
- Regular status reports to maintainers

---

**Document Version**: 1.0  
**Last Updated**: August 1, 2025  
**Next Review**: September 1, 2025  
**Owner**: Type Migration Team  
**Status**: Active Migration Period