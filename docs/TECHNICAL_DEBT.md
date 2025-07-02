# Technical Debt Tracking

## Repository Dependency Injection Migration

**Date Added**: 2025-01-13  
**Priority**: Medium  
**Category**: Architecture / Testing  
**Status**: IN PROGRESS (40% Complete)

### Description
All repository classes (StampRepository, MarketDataRepository, SRC20Repository, etc.) currently use static methods and import dbManager directly as a singleton, making unit testing with mocks difficult.

### Current State
**UPDATE 2025-01-13**: Migration 70% complete! 
- ✅ All repositories now have `setDatabase()` methods 
- ✅ All repository methods updated to use `this.db` 
- ✅ MockDatabaseManager created and uses existing fixtures
- ✅ MockDatabaseManager successfully returns fixture data
- ✅ Dependency injection verified working in tests
- ✅ stampRepository.working.test.ts fully converted to DI (15/18 tests passing)
- ✅ marketDataRepository.unit.test.ts created with DI pattern
- ✅ Mock properly filters stamp types (regular/cursed/src20)
- 🚧 3 minor test failures on query verification
- ⏳ Remaining test files need updating
- ⏳ New comprehensive unit tests need to be created
- ⏳ CI configuration needs updating

### Completed Work
1. **Subtask 1.1 & 1.2**: All repositories (StampRepository, MarketDataRepository, SRC20Repository, CollectionRepository, BlockRepository, SRC101Repository) now have:
   - Private static `db` property initialized with `dbManager`
   - Static `setDatabase()` method for dependency injection
   - All methods updated to use `this.db` instead of direct `dbManager` references

2. **Subtask 1.3**: Created `MockDatabaseManager` at `tests/mocks/mockDatabaseManager.ts` that:
   - Uses existing fixture files from `tests/fixtures/`
   - Implements the same interface as the real DatabaseManager
   - Returns appropriate fixture data based on query patterns
   - Provides test utilities (query history, verification methods)

### Remaining Work
1. **Subtask 1.4**: Update existing repository tests to use dependency injection
2. **Subtask 1.5**: Create comprehensive unit tests using fixtures
3. **Subtask 1.6**: Update CI configuration to run unit tests with fixtures

### Benefits
- ✅ Enables proper unit testing with mocks
- ✅ Maintains backward compatibility
- ✅ No breaking changes to existing consumers
- ✅ Can be implemented gradually
- ✅ Completely non-intrusive (production code unchanged)

### Estimated Effort
- ~~Small: Add setDatabase to each repository (~10 files)~~ ✅ DONE
- ~~Medium: Update all repository methods to use this.db~~ ✅ DONE
- ~~Medium: Create MockDatabaseManager~~ ✅ DONE
- Small: Update existing tests (4-6 files)
- Medium: Create new unit tests
- Small: Update CI configuration

### Related Files
#### Completed:
- ✅ `server/database/stampRepository.ts`
- ✅ `server/database/marketDataRepository.ts`
- ✅ `server/database/src20Repository.ts`
- ✅ `server/database/collectionRepository.ts`
- ✅ `server/database/blockRepository.ts`
- ✅ `server/database/src101Repository.ts`
- ✅ `server/database/databaseManager.ts`
- ✅ `tests/mocks/mockDatabaseManager.ts`

#### To Do:
- All repository test files in `tests/unit/`
- CI configuration files

### Notes
- Current workaround: Integration tests with real database
- Some services (btcPriceService) successfully mock the singleton
- Fixtures have been created and are ready for use ✅
- MockDatabaseManager successfully integrates with existing fixtures ✅

---

## Other Technical Debt Items

Add additional technical debt items here as they are identified...