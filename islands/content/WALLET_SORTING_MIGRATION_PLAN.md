# Wallet Profile Content Sorting Migration Plan

## Overview
This document outlines the plan to consolidate `WalletProfileContent.tsx` and `WalletProfileContentWithSorting.tsx`.

## Current State

### Production Component: `WalletProfileContent.tsx`
- ✅ Used in production (`routes/wallet/[address].tsx`)
- ✅ Fresh.js partial navigation support
- ✅ Uses `FreshStampGallery` and `FreshSRC20Gallery`
- ✅ Complete dispenser/listings implementation
- ❌ Basic sorting (only ASC/DESC)
- ❌ No performance metrics

### Experimental Component: `WalletProfileContentWithSorting.tsx`
- ❌ Not used in production (POC only)
- ❌ Uses older gallery components (not Fresh variants)
- ❌ Incomplete dispenser implementation
- ✅ Advanced sorting options (value_asc/desc, quantity_asc/desc, etc.)
- ✅ Performance metrics and debugging
- ✅ Sorting provider with URL sync

## Why We Cannot Use POC as Base

After validation, the POC version has critical missing features:

1. **Wrong Gallery Components**: Uses `StampGallery` instead of `FreshStampGallery`, losing partial navigation
2. **No Fresh.js Integration**: Uses `location.href` causing full page reloads
3. **Incomplete Features**: Dispenser section shows "implementation pending"
4. **Missing Production Features**: No loading skeletons, no partial navigation attributes

## Valuable Features to Extract from POC

### 1. Sorting Infrastructure
```typescript
// Section configurations with multiple sort options
const SECTION_CONFIGS: Record<string, SectionSortingConfig> = {
  stamps: {
    sortOptions: ["ASC", "DESC", "value_asc", "value_desc", "stamp_asc", "stamp_desc"],
  },
  src20: {
    sortOptions: ["ASC", "DESC", "value_asc", "value_desc", "quantity_asc", "quantity_desc"],
  },
};
```

### 2. Performance Metrics
```typescript
// Sorting performance tracking
{showSortingMetrics && metrics && (
  <div class="text-xs text-stamp-grey opacity-75">
    {metrics.totalSorts} sorts • {metrics.averageSortDuration}ms avg
  </div>
)}
```

### 3. Sorting Provider Pattern
```typescript
// Clean provider pattern for sorting context
<WalletSortingProvider defaultSort={props.stampsSortBy}>
  <WalletProfileContent {...props} />
</WalletSortingProvider>
```

## Migration Strategy

### Phase 1: Preparation (Current)
- [x] Mark `WalletProfileContentWithSorting.tsx` as deprecated/experimental
- [x] Document the migration plan
- [ ] Ensure sorting infrastructure is production-ready

### Phase 2: Feature Flag Integration
Add advanced sorting to production component behind a feature flag:

```typescript
interface WalletContentProps {
  // ... existing props
  enableAdvancedSorting?: boolean; // Default: false
  sortingConfig?: {
    enableUrlSync?: boolean;
    enablePersistence?: boolean;
    enableMetrics?: boolean;
  };
}
```

### Phase 3: Implementation
1. Import sorting infrastructure conditionally
2. Add section configurations from POC
3. Upgrade `ItemHeader` to support both sorting modes
4. Ensure Fresh navigation compatibility
5. Test with feature flag disabled (legacy mode)
6. Test with feature flag enabled (advanced mode)

### Phase 4: Gradual Rollout
1. Deploy with flag disabled
2. Enable for internal testing
3. A/B test with subset of users
4. Full rollout when stable

### Phase 5: Cleanup
1. Remove legacy sorting code
2. Delete `WalletProfileContentWithSorting.tsx`
3. Make advanced sorting the default

## Key Differences to Resolve

| Feature             | Production           | POC                  | Resolution          |
| ------------------- | -------------------- | -------------------- | ------------------- |
| Gallery Components  | Fresh variants       | Standard             | Keep Fresh variants |
| Sorting Options     | ASC/DESC only        | Multiple options     | Add all options     |
| Performance Metrics | None                 | Built-in             | Add as optional     |
| Dispenser Support   | Complete             | Partial              | Keep complete impl  |
| URL Sync            | Via Fresh navigation | Via sorting provider | Integrate both      |

## Testing Checklist
- [ ] Legacy sorting still works
- [ ] Advanced sorting with all options
- [ ] Fresh.js partial navigation
- [ ] URL synchronization
- [ ] Performance metrics accuracy
- [ ] Mobile responsiveness
- [ ] Accessibility

## Success Criteria
- Zero regression in existing functionality
- Improved user experience with advanced sorting
- Performance metrics show no degradation
- Clean, maintainable code
