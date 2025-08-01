# TypeScript Compilation Error Analysis
## Summary: 1180 total errors found

## Error Code Breakdown
| Error Code | Count | Description |
|------------|-------|-------------|
| TS2304 | 228 | Cannot find name |
| TS2305 | 216 | Module has no exported member |
| TS6133 | 159 | Declared but never read |
| TS7006 | 111 | Parameter implicitly has any type |
| TS6196 | 77 | Declared but never used |
| TS2554 | 63 | Expected X arguments, but got Y |
| TS2724 | 58 | No exported member (with suggestion) |
| TS1361 | 30 | Cannot be used as value (import type issue) |
| TS18046 | 25 | Expression is of type unknown |
| TS2339 | 21 | Property does not exist on type |
| TS7053 | 20 | Element implicitly has any type |
| TS2353 | 19 | Object literal property issues |
| TS18048 | 18 | Possibly undefined |
| TS2300 | 18 | Duplicate identifier |
| TS2459 | 16 | Module declares locally but not exported |
| TS2717 | 11 | Unknown error type |
| TS2614 | 11 | Module has no exported member |
| TS2375 | 9 | Unknown error type |
| TS6192 | 8 | All imports unused |
| TS1194 | 8 | Export declarations not permitted in namespace |
| TS2503 | 7 | Cannot find namespace |
| TS2687 | 6 | All declarations must have identical modifiers |
| TS2430 | 6 | Unknown error type |
| TS2428 | 4 | All declarations must have identical type parameters |
| TS2395 | 4 | Individual declarations must be all exported or all local |
| TS1183 | 4 | Implementation cannot be declared in ambient contexts |
| TS7030 | 3 | Not all code paths return a value |
| TS2440 | 3 | Unknown error type |
| TS2561 | 3 | Object literal property issues |
| TS2345 | 2 | Unknown error type |
| TS2322 | 2 | Unknown error type |
| TS7031 | 1 | Unknown error type |
| TS2344 | 1 | Unknown error type |
| TS2484 | 1 | Unknown error type |
| TS1036 | 1 | Unknown error type |
| TS7028 | 1 | Unknown error type |
| TS1046 | 1 | Unknown error type |
| TS1039 | 1 | Unknown error type |
| TS2314 | 1 | Unknown error type |
| TS6138 | 1 | Unknown error type |
| TS2739 | 1 | Unknown error type |

## Files with Most Errors
| File | Error Count |
|------|-------------|
| unknown | 1180 |

## Error Categories and Impact
### Missing Type Exports (TS2459, TS2305) - Priority: HIGH
**Count:** 232 errors
**Common error messages:**
- Module '"file:///Users/kevinsitzes/Documents/BTCStampsExplorer/lib/utils/ui/notifications/toastSignal.ts"' declares 'BaseToast' locally, but it is not exported. (5 occurrences)
- Module '"file:///Users/kevinsitzes/Documents/BTCStampsExplorer/components/button/index.ts"' has no exported member 'ButtonProps'. (1 occurrences)
- Module '"file:///Users/kevinsitzes/Documents/BTCStampsExplorer/lib/types/ui.d.ts"' has no exported member 'ToggleSwitchButtonProps'. (1 occurrences)

### Missing Type Definitions (TS2304) - Priority: HIGH
**Count:** 228 errors
**Common error messages:**
- Cannot find name 'SendRow'. (5 occurrences)
- Cannot find name 'SharedListProps'. (1 occurrences)
- Cannot find name 'SRC20Balance'. (1 occurrences)

### Type Import Issues (TS1361) - Priority: MEDIUM
**Count:** 30 errors
**Common error messages:**
- 'isCollectionRow' cannot be used as a value because it was imported using 'import type'. (4 occurrences)
- 'CollectionValidationErrorCode' cannot be used as a value because it was imported using 'import type'. (3 occurrences)
- 'isCollectionWithMarketData' cannot be used as a value because it was imported using 'import type'. (2 occurrences)

### Unused Declarations (TS6133, TS6192) - Priority: LOW
**Count:** 167 errors
**Common error messages:**
- 'JSX' is declared but its value is never read. (2 occurrences)
- 'SRC20Row' is declared but its value is never read. (2 occurrences)
- 'Timeframe' is declared but its value is never read. (2 occurrences)

### Namespace Errors (TS2303) - Priority: MEDIUM
**Count:** 0 errors

### Argument Errors (TS2554) - Priority: MEDIUM
**Count:** 63 errors
**Common error messages:**
- Expected 2 arguments, but got 1. (10 occurrences)

## Fix Priority Recommendations

### 1. HIGH PRIORITY - Type Export Issues
- Fix TS2459 errors: Export locally declared types
- Fix TS2305 errors: Add missing type exports to modules
- Impact: These break type imports across the codebase

### 2. HIGH PRIORITY - Missing Type Definitions
- Fix TS2304 errors: Import or define missing types
- Common missing types: StampRow, SRC20Row, SendRow, etc.
- Impact: Core functionality cannot be properly typed

### 3. MEDIUM PRIORITY - Type Import Issues
- Fix TS1361 errors: Use proper import syntax for types vs values
- Change import type to regular import for runtime values
- Impact: Runtime errors when types are used as values

### 4. LOW PRIORITY - Cleanup
- Fix TS6133/TS6192 errors: Remove unused imports and declarations
- Impact: Code clarity and bundle size

## Critical Files Needing Export Fixes
These files declare types locally but don't export them:

- **notifications/toastSignal.ts**: 7 missing exports
- **types/sorting.d.ts**: 5 missing exports
- **types/collection.d.ts**: 2 missing exports
- **types/ui.d.ts**: 1 missing exports
- **utils/circuitBreaker.ts**: 1 missing exports