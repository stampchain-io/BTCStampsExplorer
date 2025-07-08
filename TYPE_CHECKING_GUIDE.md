# TypeScript Type Checking Guide

This guide explains how TypeScript type checking works in the BTCStampsExplorer project and how to use the available tools during development.

## Current Status

The project is in **gradual improvement mode** for TypeScript type safety. This means:

- ✅ Type checking runs in CI but **doesn't block PRs**
- ✅ Comprehensive analysis and reporting is provided
- ✅ Developers are encouraged to fix errors incrementally
- ✅ Focus is on preventing new errors while gradually fixing existing ones

**Current Error Count**: ~262 TypeScript errors (as of latest analysis)

## Available Tools

### 1. Comprehensive Analysis (`deno task analyze:types`)

Runs a full TypeScript analysis of the entire codebase and generates a detailed report.

```bash
deno task analyze:types
```

**What it does:**
- Analyzes all TypeScript errors in the project
- Categorizes errors by type (ASSIGNMENT_ERROR, MISSING_PROPERTY, etc.)
- Identifies critical files with the most errors
- Generates a report in `reports/type-error-analysis.md`

**When to use:**
- Before starting a major refactoring
- To track overall progress
- To understand the current state of type safety

### 2. Staged File Checking (`deno task check:types:staged`)

Checks only the TypeScript files you've staged for commit.

```bash
deno task check:types:staged
```

**What it does:**
- Finds all staged `.ts` and `.tsx` files (excluding tests)
- Runs type checking on each file individually
- Provides a summary of errors found
- **Does not block commits** (gradual improvement mode)

**When to use:**
- Before committing changes
- To check if your changes introduce new type errors
- As part of your development workflow

### 3. Individual File Checking

Check a specific file for type errors.

```bash
deno check path/to/your/file.ts
```

**When to use:**
- When working on a specific file
- To see detailed error messages for a single file
- During active development

### 4. Main Entry Point Checking (`deno task check:types`)

Checks the main entry points (`main.ts` and `dev.ts`) which transitively checks most of the codebase.

```bash
deno task check:types
```

**Note:** This currently fails due to existing errors but provides comprehensive error output.

## CI/CD Integration

### GitHub Actions Workflow

The TypeScript checking workflow (`.github/workflows/type-check.yml`) runs on every PR and provides:

1. **Comprehensive Analysis**: Full project type checking (non-blocking)
2. **Changed File Analysis**: Detailed checking of files modified in the PR
3. **Progress Tracking**: Reports and summaries in the GitHub Actions summary
4. **Artifact Upload**: Type analysis reports for download

### What Happens in CI

**For Pull Requests:**
- ✅ Analyzes all changed TypeScript files
- ✅ Provides detailed feedback on each file
- ✅ Shows summary statistics
- ✅ **Never blocks the PR** (gradual improvement mode)
- ✅ Uploads analysis reports as artifacts

**For Push to main/dev:**
- ✅ Runs comprehensive analysis
- ✅ Updates the overall error tracking
- ✅ Provides trend analysis

## Error Categories

Based on the latest analysis, the main error types are:

1. **ASSIGNMENT_ERROR (33%)**: Type assignment issues, often related to `exactOptionalPropertyTypes`
2. **MISSING_PROPERTY (27%)**: Properties that don't exist on types
3. **TYPE_MISMATCH (6%)**: Argument type mismatches
4. **UNDEFINED_NAME (2%)**: Cannot find name errors
5. **OTHER (32%)**: Various other TypeScript errors

## Development Workflow

### Recommended Approach

1. **Before Starting Work:**
   ```bash
   # Check the current state
   deno task analyze:types
   ```

2. **During Development:**
   ```bash
   # Check specific files you're working on
   deno check path/to/your/file.ts
   ```

3. **Before Committing:**
   ```bash
   # Check staged files
   deno task check:types:staged
   ```

4. **Optional - Fix Some Errors:**
   - If you're working in a file with type errors, consider fixing a few
   - Focus on easy wins like adding type annotations
   - Don't feel obligated to fix everything

### Quick Fixes for Common Errors

#### TS2375 - exactOptionalPropertyTypes Issues

```typescript
// ❌ Problem
interface Props {
  name?: string;
}
const value: string | undefined = getName();
const props: Props = { name: value }; // Error!

// ✅ Solution 1: Handle undefined explicitly
const props: Props = { name: value ?? undefined };

// ✅ Solution 2: Update interface
interface Props {
  name?: string | undefined;
}
```

#### TS2339 - Missing Properties

```typescript
// ❌ Problem
const result = await query();
console.log(result.rows); // Error: Property 'rows' does not exist

// ✅ Solution: Type assertion
const result = await query() as any;
console.log(result.rows);

// ✅ Better solution: Proper typing
interface QueryResult {
  rows: any[];
}
const result = await query() as QueryResult;
```

#### TS18046 - Unknown Types

```typescript
// ❌ Problem
const data = await fetchData();
data.someProperty; // Error: 'data' is of type 'unknown'

// ✅ Solution
const data = await fetchData() as any;
// or
const data = await fetchData();
if (data && typeof data === 'object') {
  // Type narrowing
}
```

## Configuration

### TypeScript Compiler Options

The project uses strict TypeScript settings in `deno.json`:

```json
{
  "compilerOptions": {
    "strict": true,
    "exactOptionalPropertyTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

The `exactOptionalPropertyTypes: true` setting is the source of many current errors but provides better type safety.

## Future Plans

### Gradual Improvement Goals

1. **Phase 1** (Current): Non-blocking analysis and reporting
2. **Phase 2**: Enable blocking for new errors in changed files
3. **Phase 3**: Strict mode once errors are reduced to <50
4. **Phase 4**: Zero-tolerance for type errors

### Progress Tracking

- Current errors: ~262
- Target for Phase 2: <100 errors
- Target for Phase 3: <50 errors
- Target for Phase 4: 0 errors

## Getting Help

### Common Commands Reference

```bash
# Full analysis
deno task analyze:types

# Check staged files
deno task check:types:staged

# Check specific file
deno check path/to/file.ts

# Check main entry points
deno task check:types

# View analysis report
cat reports/type-error-analysis.md
```

### Troubleshooting

**Q: The type checker is taking too long**
A: Use file-specific checking: `deno check path/to/file.ts`

**Q: I'm getting errors I don't understand**
A: Check the error categories in the analysis report for common patterns

**Q: Should I fix all errors in a file I'm working on?**
A: Fix what you can easily, but don't feel obligated to fix everything. Gradual improvement is the goal.

**Q: Can I disable type checking for my PR?**
A: Type checking is already non-blocking. Your PR won't be blocked by existing errors.

## Contributing to Type Safety

Every small improvement helps! Consider:

- Adding type annotations when you see `any` types
- Fixing obvious type mismatches
- Adding proper interfaces for data structures
- Handling `undefined` values explicitly

Remember: **Gradual improvement is better than no improvement!** 