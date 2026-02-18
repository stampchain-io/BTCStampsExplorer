# 🚀 World-Class Sorting Infrastructure Integration Guide

This guide shows how to integrate the new world-class sorting infrastructure with existing stampchain.io components while maintaining backward compatibility.

## 📋 Table of Contents

1. [Quick Start](#quick-start)
2. [Basic Integration](#basic-integration)
3. [Advanced Integration](#advanced-integration)
4. [Migration Strategies](#migration-strategies)
5. [Component Examples](#component-examples)
6. [Best Practices](#best-practices)

---

## 🚀 Quick Start

### 1. Import the Sorting Infrastructure

```tsx
// Basic sorting components
import {
  SortingProvider,
  SortingComponent,
  useSorting,
} from "$islands/sorting/index.ts";

// URL-aware sorting (recommended)
import {
  WalletSortingProvider,
  CompleteSortingInterface,
  useURLAwareSorting,
} from "$islands/sorting/index.ts";

// Types
import type { WalletSortKey, SortDirection } from "$lib/types/sorting.d.ts";
```

### 2. Wrap Your Component with a Sorting Provider

```tsx
export default function MyPage() {
  return (
    <WalletSortingProvider defaultSort="DESC">
      <MyPageContent />
    </WalletSortingProvider>
  );
}
```

### 3. Use Sorting in Your Components

```tsx
function MyPageContent() {
  const { sortBy, setSortBy, isLoading } = useSorting();

  return (
    <div>
      <CompleteSortingInterface
        variant="compact"
        size="md"
        onSortChange={setSortBy}
      />
      <MyDataDisplay sortBy={sortBy} />
    </div>
  );
}
```

---

## 🔧 Basic Integration

### Step 1: Choose Your Provider

```tsx
// For wallet pages
<WalletSortingProvider defaultSort="DESC">
  {children}
</WalletSortingProvider>

// For stamp pages
<StampSortingProvider defaultSort="DESC">
  {children}
</StampSortingProvider>

// For collection pages
<CollectionSortingProvider defaultSort="DESC">
  {children}
</CollectionSortingProvider>

// Custom configuration
<SortingProviderWithURL
  config={{
    defaultSort: "VALUE_DESC",
    enableUrlSync: true,
    urlConfig: {
      paramName: "customSort",
      resetPage: true,
    },
  }}
>
  {children}
</SortingProviderWithURL>
```

### Step 2: Add Sorting UI

```tsx
function MyComponent() {
  const { sortBy, setSortBy } = useSorting();

  return (
    <div>
      {/* Option 1: Complete Interface (Recommended) */}
      <CompleteSortingInterface
        variant="responsive"
        size="md"
        showLabel={true}
        onSortChange={setSortBy}
      />

      {/* Option 2: Individual Components */}
      <SortingComponent>
        <SortingComponent.Dropdown />
        <SortingComponent.Label />
      </SortingComponent>

      {/* Option 3: Styled Components */}
      <StyledSortingButtons
        variant="primary"
        size="md"
        sortBy={sortBy}
        onSortChange={setSortBy}
      />
    </div>
  );
}
```

---

## 🎯 Advanced Integration

### Backward Compatibility Pattern

```tsx
interface EnhancedComponentProps {
  // Existing props
  data: any[];
  onSort?: (sort: "ASC" | "DESC") => void;

  // New props
  enableAdvancedSorting?: boolean;
  sortingConfig?: SortingConfig;
}

function EnhancedComponent({
  data,
  onSort,
  enableAdvancedSorting = true,
  sortingConfig = {},
}: EnhancedComponentProps) {
  const { sortBy, setSortBy } = useSorting();

  if (!enableAdvancedSorting) {
    // Legacy mode - use existing sorting
    return <LegacyComponent data={data} onSort={onSort} />;
  }

  // Enhanced mode - use new sorting infrastructure
  return (
    <div>
      <CompleteSortingInterface
        onSortChange={(newSort) => {
          setSortBy(newSort);
          onSort?.(newSort === "ASC" ? "ASC" : "DESC");
        }}
      />
      <DataDisplay data={data} sortBy={sortBy} />
    </div>
  );
}
```

### URL Synchronization

```tsx
function MyPageWithURL() {
  const {
    sortBy,
    setSortBy,
    getUpdatedURL,
    navigateToSort
  } = useURLAwareSorting();

  const handleSortChange = (newSort: WalletSortKey) => {
    // Option 1: Update URL and navigate
    navigateToSort(newSort);

    // Option 2: Get URL for custom handling
    const newUrl = getUpdatedURL(newSort);
    // Custom navigation logic here
  };

  return (
    <CompleteSortingInterface
      onSortChange={handleSortChange}
    />
  );
}
```

### Performance Metrics

```tsx
function MyComponentWithMetrics() {
  const { metrics } = useSortingMetrics();

  return (
    <div>
      <CompleteSortingInterface />

      {/* Debug metrics */}
      <div className="debug-metrics">
        <p>Total sorts: {metrics.totalSorts}</p>
        <p>Average duration: {metrics.averageSortDuration}ms</p>
        <p>Cache hits: {metrics.cacheHits}</p>
      </div>
    </div>
  );
}
```

---

## 🔄 Migration Strategies

### Strategy 1: Gradual Migration

```tsx
// Phase 1: Add new sorting alongside existing
function WalletPage(props) {
  const [useNewSorting, setUseNewSorting] = useState(false);

  if (useNewSorting) {
    return (
      <WalletSortingProvider>
        <EnhancedWalletContent {...props} />
      </WalletSortingProvider>
    );
  }

  return <LegacyWalletContent {...props} />;
}

// Phase 2: Feature flag
function WalletPage(props) {
  const enableNewSorting = useFeatureFlag('enhanced-sorting');

  return (
    <WalletSortingProvider>
      <WalletContent
        {...props}
        enableAdvancedSorting={enableNewSorting}
      />
    </WalletSortingProvider>
  );
}

// Phase 3: Full migration
function WalletPage(props) {
  return (
    <WalletSortingProvider>
      <EnhancedWalletContent {...props} />
    </WalletSortingProvider>
  );
}
```

### Strategy 2: Component-by-Component

```tsx
// Step 1: Migrate header component
function PageHeader({ enableNewSorting = false }) {
  if (enableNewSorting) {
    return <CompleteSortingInterface />;
  }
  return <LegacySortButton />;
}

// Step 2: Migrate data display
function DataDisplay({ enableNewSorting = false }) {
  const { sortBy } = enableNewSorting ? useSorting() : { sortBy: "DESC" };

  return <Gallery sortBy={sortBy} />;
}

// Step 3: Migrate page wrapper
function MyPage() {
  return (
    <WalletSortingProvider>
      <PageHeader enableNewSorting={true} />
      <DataDisplay enableNewSorting={true} />
    </WalletSortingProvider>
  );
}
```

---

## 📝 Component Examples

### Example 1: Enhanced Wallet Section

```tsx
function EnhancedWalletSection({
  title,
  data,
  sortOptions,
  onSortChange,
  enableAdvancedSorting = true,
}) {
  const { sortBy, setSortBy, metrics } = useSorting();

  return (
    <div className="wallet-section">
      {/* Header with sorting */}
      <div className="section-header">
        <h2>{title}</h2>

        {enableAdvancedSorting ? (
          <CompleteSortingInterface
            variant="compact"
            size="sm"
            availableOptions={sortOptions}
            onSortChange={(newSort) => {
              setSortBy(newSort);
              onSortChange?.(newSort);
            }}
          />
        ) : (
          <LegacySortButton />
        )}
      </div>

      {/* Data display */}
      <div className="section-content">
        <DataGrid data={data} sortBy={sortBy} />
      </div>

      {/* Performance metrics (debug mode) */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-metrics">
          Sorts: {metrics.totalSorts} |
          Avg: {metrics.averageSortDuration}ms
        </div>
      )}
    </div>
  );
}
```

### Example 2: Responsive Sorting Interface

```tsx
function ResponsiveSortingInterface() {
  const { sortBy, setSortBy } = useSorting();

  return (
    <div className="responsive-sorting">
      {/* Mobile: Dropdown */}
      <div className="block md:hidden">
        <StyledSortingDropdown
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
      </div>

      {/* Desktop: Buttons */}
      <div className="hidden md:block">
        <StyledSortingButtons
          variant="primary"
          size="md"
          sortBy={sortBy}
          onSortChange={setSortBy}
        />
      </div>
    </div>
  );
}
```

### Example 3: Multi-Section Sorting

```tsx
function MultiSectionPage() {
  return (
    <div>
      {/* Stamps section */}
      <WalletSortingProvider
        defaultSort="DESC"
        testId="stamps-sorting"
      >
        <StampSection />
      </WalletSortingProvider>

      {/* Tokens section */}
      <WalletSortingProvider
        defaultSort="VALUE_DESC"
        testId="tokens-sorting"
      >
        <TokenSection />
      </WalletSortingProvider>
    </div>
  );
}
```

---

## 💡 Best Practices

### 1. Provider Placement

```tsx
// ✅ Good: Place provider at page level
function WalletPage() {
  return (
    <WalletSortingProvider>
      <WalletHeader />
      <WalletContent />
    </WalletSortingProvider>
  );
}

// ❌ Avoid: Multiple providers for same data
function WalletPage() {
  return (
    <div>
      <WalletSortingProvider>
        <WalletHeader />
      </WalletSortingProvider>
      <WalletSortingProvider>
        <WalletContent />
      </WalletSortingProvider>
    </div>
  );
}
```

### 2. URL Parameter Naming

```tsx
// ✅ Good: Descriptive parameter names
<SortingProviderWithURL
  config={{
    urlConfig: {
      paramName: "stampsSortBy",
      pageParamName: "stamps_page",
    },
  }}
>

// ❌ Avoid: Generic parameter names
<SortingProviderWithURL
  config={{
    urlConfig: {
      paramName: "sort",
      pageParamName: "page",
    },
  }}
>
```

### 3. Performance Optimization

```tsx
// ✅ Good: Memoize expensive operations
function MyComponent() {
  const { sortBy } = useSorting();

  const sortedData = useMemo(() => {
    return heavySortOperation(data, sortBy);
  }, [data, sortBy]);

  return <DataDisplay data={sortedData} />;
}

// ✅ Good: Use appropriate sort options
<CompleteSortingInterface
  availableOptions={['ASC', 'DESC', 'VALUE_DESC']} // Only what's needed
  onSortChange={handleSort}
/>
```

### 4. Error Handling

```tsx
function MyComponent() {
  const { sortBy, error, retry } = useSorting();

  if (error) {
    return (
      <div className="sort-error">
        <p>Sorting failed: {error.message}</p>
        <button onClick={retry}>Retry</button>
      </div>
    );
  }

  return <DataDisplay sortBy={sortBy} />;
}
```

### 5. Testing

```tsx
// Test with sorting provider
function renderWithSorting(component: ReactNode) {
  return render(
    <WalletSortingProvider testId="test-sorting">
      {component}
    </WalletSortingProvider>
  );
}

// Test component
test('should handle sort change', () => {
  renderWithSorting(<MyComponent />);

  const sortButton = screen.getByTestId('sort-button');
  fireEvent.click(sortButton);

  expect(screen.getByText('Sorted by: ASC')).toBeInTheDocument();
});
```

---

## 🎉 Conclusion

The world-class sorting infrastructure provides:

- **Backward Compatibility**: Existing components continue to work
- **Progressive Enhancement**: Opt-in to new features
- **Performance**: Built-in metrics and optimization
- **Flexibility**: Multiple integration patterns
- **Maintainability**: Consistent API across components

Start with basic integration and gradually adopt advanced features as needed!
