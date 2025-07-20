# 🚀 World-Class Sorting Infrastructure

A comprehensive, reusable sorting system for BTCStampsExplorer built with Fresh.js best practices.

## 📋 Overview

This sorting infrastructure provides:
- **Universal Sorting**: Works across wallet, stamp, and collection pages
- **URL Synchronization**: Maintains sort state in URL parameters
- **Performance Optimized**: Debounced updates, localStorage persistence, metrics tracking
- **Accessibility First**: Full ARIA support, keyboard navigation
- **Fresh.js Native**: Built for Deno Fresh with SSR support
- **TypeScript Complete**: Full type safety and IntelliSense

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Sorting Infrastructure                    │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  SortingProvider │  │ SortingComponent │  │ SortingStyles   │ │
│  │                 │  │                 │  │                 │ │
│  │ • State Mgmt    │  │ • UI Components │  │ • Design System │ │
│  │ • Persistence   │  │ • Accessibility │  │ • Responsive    │ │
│  │ • Metrics       │  │ • Compound API  │  │ • Variants      │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
├─────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │ URL Sync Hook   │  │ URL Provider    │  │ Integration     │ │
│  │                 │  │                 │  │                 │ │
│  │ • URL Params    │  │ • URL-Aware     │  │ • Examples      │ │
│  │ • History API   │  │ • Convenience   │  │ • Migration     │ │
│  │ • Fresh.js      │  │ • Providers     │  │ • Guide         │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
└─────────────────────────────────────────────────────────────┘
```

## 🚀 Quick Start

### 1. Basic Usage (No URL Sync)

```tsx
import { SortingProvider, SortingComponent } from "$islands/sorting";

function MyComponent() {
  return (
    <SortingProvider config={{ defaultSort: "DESC" }}>
      <SortingComponent.Dropdown />
      <MyDataDisplay />
    </SortingProvider>
  );
}
```

### 2. URL-Aware Usage (Recommended)

```tsx
import { WalletSortingProvider, CompleteSortingInterface } from "$islands/sorting";

function WalletPage() {
  return (
    <WalletSortingProvider>
      <CompleteSortingInterface variant="wallet" />
      <WalletStampGallery />
    </WalletSortingProvider>
  );
}
```

### 3. Custom Integration

```tsx
import { useSorting, SortingComponent } from "$islands/sorting";

function CustomSortingUI() {
  const { sortBy, setSortBy, isLoading, metrics } = useSorting();

  return (
    <div>
      <SortingComponent.Buttons variant="primary" />
      <div>Current: {sortBy} | Performance: {metrics.averageSortDuration}ms</div>
    </div>
  );
}
```

## 📚 Components

### Core Components

| Component          | Purpose           | Features                             |
| ------------------ | ----------------- | ------------------------------------ |
| `SortingProvider`  | State management  | Persistence, metrics, error handling |
| `SortingComponent` | UI components     | Compound API, accessibility          |
| `SortingStyles`    | Styled components | Design system integration            |

### URL-Aware Components

| Component                   | Purpose             | Use Case             |
| --------------------------- | ------------------- | -------------------- |
| `SortingProviderWithURL`    | URL synchronization | Pages with URL state |
| `WalletSortingProvider`     | Wallet-specific     | Wallet pages         |
| `StampSortingProvider`      | Stamp-specific      | Stamp galleries      |
| `CollectionSortingProvider` | Collection-specific | Collection pages     |

### Utility Hooks

| Hook                  | Purpose              | Returns                                    |
| --------------------- | -------------------- | ------------------------------------------ |
| `useSorting()`        | Access sorting state | `{ sortBy, setSortBy, isLoading, ... }`    |
| `useSortingMetrics()` | Performance metrics  | `{ averageSortDuration, totalSorts, ... }` |
| `useSortingURL()`     | URL synchronization  | `{ getUpdatedURL, navigateToSort, ... }`   |

## 🎨 Design System Integration

### Variants

- **Primary**: Main sorting controls with full styling
- **Secondary**: Subtle sorting controls for secondary content
- **Ghost**: Minimal styling for dense layouts

### Sizes

- **sm**: 34px height, compact spacing
- **md**: 38px height, standard spacing (default)
- **lg**: 42px height, generous spacing

### Responsive Behavior

- **Mobile**: Dropdown interface with touch-friendly targets
- **Desktop**: Button interface with hover states
- **Tablet**: Adaptive based on screen width

## 🔧 Configuration

### Sort Keys

#### Wallet Sort Keys
```typescript
type WalletSortKey =
  | "ASC" | "DESC"           // Basic stamp number sorting
  | "value_asc" | "value_desc" // Market value sorting
  | "quantity_asc" | "quantity_desc" // Balance quantity sorting
  | "recent_asc" | "recent_desc"; // Recent activity sorting
```

#### Stamp Sort Keys
```typescript
type StampSortKey =
  | "ASC" | "DESC"           // Basic stamp number sorting
  | "price_asc" | "price_desc" // Price sorting
  | "recent_asc" | "recent_desc"; // Recent activity sorting
```

### Provider Configuration

```typescript
interface SortingProviderConfig {
  defaultSort: SortKey;
  enablePersistence?: boolean;
  enableMetrics?: boolean;
  enableUrlSync?: boolean;
  urlConfig?: {
    paramName?: string;
    resetPage?: boolean;
    pageParamName?: string;
  };
}
```

## 🧪 Testing

### Unit Tests

```bash
# Run sorting infrastructure tests
deno test islands/sorting/tests/

# Run specific test suites
deno test islands/sorting/tests/SortingProvider.test.tsx
deno test islands/sorting/tests/URLSync.test.tsx
```

### Integration Tests

```bash
# Test with real components
deno test tests/integration/sorting/
```

### Performance Tests

```bash
# Benchmark sorting performance
deno test islands/sorting/tests/performance/
```

## 🔍 Debugging

### Enable Debug Mode

```typescript
// Add to your component
const { metrics } = useSortingMetrics();
console.log('Sorting Performance:', metrics);
```

### Debug URL Sync

```typescript
// Check URL synchronization
const { getUpdatedURL } = useSortingURL({ defaultSort: "DESC" });
console.log('Next URL:', getUpdatedURL("value_desc"));
```

## 📈 Performance

### Metrics Available

- **Average Sort Duration**: Time taken for sort operations
- **Total Sorts**: Number of sort operations performed
- **Cache Hit Rate**: Percentage of cached sort results
- **URL Sync Latency**: Time for URL synchronization

### Optimization Features

- **Debounced URL Updates**: Prevents excessive URL changes
- **localStorage Persistence**: Remembers user preferences
- **Lazy Loading**: Components load only when needed
- **Memoization**: Prevents unnecessary re-renders

## 🛠️ Migration Guide

See [INTEGRATION_GUIDE.md](./INTEGRATION_GUIDE.md) for detailed migration instructions.

## 🤝 Contributing

1. **Follow TypeScript**: All components must be fully typed
2. **Test Coverage**: Minimum 90% test coverage required
3. **Accessibility**: WCAG 2.1 AA compliance required
4. **Performance**: No component should add >50ms to page load

## 📄 License

Part of BTCStampsExplorer - see project license.
