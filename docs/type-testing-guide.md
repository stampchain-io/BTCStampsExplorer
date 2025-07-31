# Type Testing Guide

This guide covers the automated type testing pipeline for the BTCStampsExplorer Deno Fresh 2.4 project, including configuration, usage, and troubleshooting.

## Overview

The type testing pipeline provides automated validation of TypeScript type definitions with regression detection, coverage reporting, and CI/CD integration. It's designed to support gradual type improvement while maintaining project stability.

## Quick Start

### Basic Usage

```bash
# Run all type tests
deno task type:test

# Run domain-specific tests
deno task type:test:domain

# Check staged files only
deno task type:check:staged

# Run regression tests
deno task type:test:regression

# Generate coverage report
deno task type:coverage

# Run full CI pipeline
deno task type:test:ci
```

### Pre-commit Integration

Type checking is automatically integrated into the pre-commit hook:

```bash
git add your-files.ts
git commit -m "your message"  # Runs type checks automatically
```

## Pipeline Components

### 1. Type Checking

**Command**: `deno task type:check`

- Validates all `.d.ts` files in `lib/types/` and `server/types/`
- Uses Deno's built-in type checker
- Reports compilation errors and type mismatches

### 2. Type Tests

**Command**: `deno task type:test`

- Runs comprehensive tests for type definitions
- Tests type assertions and validations
- Validates type utilities and constraints

### 3. Regression Detection

**Command**: `deno task type:test:regression`

- Compares current results against baseline
- Detects new type errors (regressions)
- Identifies resolved errors (improvements)
- Maintains baseline in `reports/type-testing/baseline.json`

### 4. Coverage Reporting

**Command**: `deno task type:coverage`

- Calculates type definition test coverage
- Provides domain-specific coverage metrics
- Identifies untested type files
- Generates detailed coverage reports

### 5. CI/CD Pipeline

**Command**: `deno task type:test:ci`

- Runs comprehensive pipeline validation
- Includes all checks: types, tests, regression, coverage
- Exits with proper codes for CI/CD integration
- Generates consolidated reports

## Configuration

### Environment Variables

#### `TYPE_CHECK_STRICT`

Controls pre-commit behavior:

```bash
# Gradual improvement mode (default)
export TYPE_CHECK_STRICT=false

# Strict mode - fails on any type errors
export TYPE_CHECK_STRICT=true
```

#### Coverage Threshold

The pipeline warns when coverage falls below 80%. This threshold can be modified in `scripts/type-testing-pipeline.ts`:

```typescript
const coverageThreshold = 80; // Adjust as needed
```

### deno.json Tasks

The following tasks are configured in `deno.json`:

```json
{
  "tasks": {
    "type:test": "deno check lib/types/**/*.d.ts server/types/**/*.d.ts && deno test --allow-read --allow-run test/types/ --no-check=remote",
    "type:test:domain": "deno test --allow-read --allow-run test/types/ --filter=\"domain\" --no-check=remote",
    "type:test:regression": "deno run --allow-read --allow-write --allow-run scripts/type-testing-pipeline.ts --mode=regression",
    "type:test:ci": "deno run --allow-read --allow-write --allow-run scripts/type-testing-pipeline.ts --mode=ci",
    "type:coverage": "deno run --allow-read --allow-write --allow-run scripts/type-testing-pipeline.ts --mode=coverage",
    "type:check": "deno check lib/types/**/*.d.ts server/types/**/*.d.ts",
    "type:check:all": "deno check .",
    "type:check:staged": "deno run --allow-read --allow-write --allow-run scripts/type-check-staged.ts"
  }
}
```

## Directory Structure

```
project/
├── lib/types/                     # Type definitions
│   ├── api.d.ts                  # API types
│   ├── base.d.ts                 # Base Bitcoin types
│   ├── stamp.d.ts                # Stamp types
│   ├── src20.d.ts                # SRC-20 types
│   └── ...
├── test/types/                   # Type tests
│   ├── core/
│   │   ├── base_test.ts          # Base type tests
│   │   └── bitcoin_base_test.ts  # Bitcoin type tests
│   ├── utils/
│   │   ├── typeAssertions.ts     # Test utilities
│   │   └── typeValidation.ts     # Validation utilities
│   └── ...
├── scripts/
│   ├── type-testing-pipeline.ts  # Main pipeline script
│   └── type-check-staged.ts      # Staged file checker
└── reports/type-testing/         # Generated reports
    ├── baseline.json             # Regression baseline
    ├── coverage-*.json           # Coverage reports
    ├── regression-*.json         # Regression reports
    └── ci-report-*.json          # CI reports
```

## Writing Type Tests

### Basic Test Structure

```typescript
// test/types/domain/example_test.ts
import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import type { ExampleType } from "@/lib/types/example.d.ts";

Deno.test("ExampleType - domain test", () => {
  // Test type constraints
  const validExample: ExampleType = {
    id: "test",
    value: 123
  };
  
  assertEquals(typeof validExample.id, "string");
  assertEquals(typeof validExample.value, "number");
});
```

### Type Assertion Tests

```typescript
import { assertType } from "@/test/types/utils/typeAssertions.ts";

Deno.test("Type assertions", () => {
  // Test exact type matching
  assertType<string>("hello");
  assertType<number>(42);
  
  // Test complex types
  assertType<StampData>({
    stamp: 1,
    asset: "STAMP",
    block_index: 123456
  });
});
```

### Domain-Specific Tests

Organize tests by domain for better coverage reporting:

- `test/types/core/` - Core Bitcoin and base types
- `test/types/api/` - API-related types
- `test/types/stamp/` - Stamp-specific types
- `test/types/src20/` - SRC-20 token types
- `test/types/utils/` - Utility and helper types

## CI/CD Integration

### GitHub Actions Example

```yaml
name: Type Testing Pipeline

on: [push, pull_request]

jobs:
  type-tests:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: denoland/setup-deno@v1
        with:
          deno-version: v1.44.x
      
      - name: Run Type Testing Pipeline
        run: deno task type:test:ci
      
      - name: Upload Reports
        uses: actions/upload-artifact@v4
        if: always()
        with:
          name: type-testing-reports
          path: reports/type-testing/
```

### Local CI Simulation

```bash
# Simulate CI environment locally
deno task type:test:ci

# Check exit code
echo $?  # 0 = success, 1 = failure
```

## Reports and Monitoring

### Coverage Reports

Generated in `reports/type-testing/coverage-*.json`:

```json
{
  "timestamp": "2024-07-31T12:00:00.000Z",
  "totalFiles": 8,
  "testedFiles": 6,
  "coverage": 75.0,
  "untested": ["lib/types/untested.d.ts"],
  "domainCoverage": {
    "api": { "files": 1, "tested": 1, "coverage": 100 },
    "stamp": { "files": 1, "tested": 1, "coverage": 100 },
    "base": { "files": 1, "tested": 1, "coverage": 100 }
  }
}
```

### Regression Reports

Generated in `reports/type-testing/regression-*.json`:

```json
{
  "timestamp": "2024-07-31T12:00:00.000Z",
  "baseline": { /* previous results */ },
  "current": { /* current results */ },
  "regressions": ["New error: Type 'X' is not assignable..."],
  "improvements": ["Resolved error: Property 'Y' missing..."]
}
```

### CI Reports

Comprehensive reports in `reports/type-testing/ci-report-*.json` include:

- Complete type check results
- Regression analysis
- Coverage metrics
- Overall success status

## Troubleshooting

### Common Issues

#### 1. Type Check Failures

**Symptoms**: `deno check` fails with type errors

**Solutions**:
- Review error messages carefully
- Check import paths and type definitions
- Ensure all dependencies are properly typed
- Use gradual typing for complex migrations

#### 2. Test Import Errors

**Symptoms**: Test files can't import type definitions

**Solutions**:
- Check import paths use correct aliases (`@/lib/types/...`)
- Ensure `deno.json` import map is correct
- Verify file permissions and existence

#### 3. Pre-commit Hook Failures

**Symptoms**: Commits blocked by type checking

**Solutions**:
```bash
# Bypass for emergency fixes (use sparingly)
git commit --no-verify -m "emergency fix"

# Or fix the types
deno task type:check:staged  # See specific errors
deno check path/to/file.ts   # Fix individual files
```

#### 4. Coverage Calculation Issues

**Symptoms**: Incorrect coverage percentages

**Solutions**:
- Ensure test files follow naming convention (`*_test.ts`)
- Check that type definition files are in expected locations
- Verify directory traversal permissions

#### 5. Baseline Corruption

**Symptoms**: Regression tests always show changes

**Solutions**:
```bash
# Reset baseline
rm reports/type-testing/baseline.json
deno task type:test:regression  # Creates new baseline
```

### Debug Mode

Enable verbose output:

```bash
# Add debug logging to pipeline script
DENO_LOG=debug deno task type:test:ci

# Check individual components
deno check --verbose lib/types/**/*.d.ts
deno test --verbose test/types/
```

### Performance Issues

If type checking is slow:

1. **Incremental checking**: Use `type:check:staged` for development
2. **Parallel execution**: Tests run in parallel by default
3. **File watching**: Use `type:test:watch` during development
4. **Selective testing**: Use `type:test:domain` for specific areas

## Best Practices

### Development Workflow

1. **Write types first**: Define interfaces before implementation
2. **Test incrementally**: Add tests as you add type definitions
3. **Use gradual mode**: Don't let perfect be the enemy of good
4. **Monitor coverage**: Aim for 80%+ coverage over time
5. **Review regressions**: Address new type errors promptly

### Type Definition Guidelines

1. **Domain organization**: Group related types in appropriate files
2. **Clear naming**: Use descriptive interface and type names
3. **Documentation**: Include JSDoc comments for complex types
4. **Backwards compatibility**: Consider migration impact of changes
5. **Strict types**: Prefer exact types over loose ones when possible

### Testing Guidelines

1. **Comprehensive coverage**: Test both happy paths and edge cases
2. **Domain separation**: Organize tests by functional domain
3. **Clear assertions**: Make test intentions obvious
4. **Failure messages**: Provide helpful error messages
5. **Maintainability**: Keep tests simple and focused

## Migration Support

The pipeline supports gradual migration from untyped to typed code:

### Phase 1: Baseline
- Establish current state as baseline
- Enable pipeline without strict enforcement
- Begin adding type definitions

### Phase 2: Coverage
- Add tests for new type definitions
- Monitor coverage improvements
- Address easy type fixes

### Phase 3: Enforcement
- Enable strict mode for new code
- Set coverage targets
- Plan systematic type improvements

### Phase 4: Completion
- Achieve target coverage (80%+)
- Enable strict mode globally
- Maintain type safety

## Support and Maintenance

### Regular Tasks

- **Weekly**: Review coverage reports and plan improvements
- **Monthly**: Update baseline if significant improvements made
- **Quarterly**: Review and update type testing strategy

### Pipeline Updates

When updating the pipeline:

1. Test changes thoroughly in development
2. Update documentation
3. Communicate changes to team
4. Monitor for regressions after deployment

---

**Last Updated**: July 31, 2024
**Pipeline Version**: 1.0.0
**Deno Version**: 1.44.x