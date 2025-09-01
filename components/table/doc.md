# Table Management System Documentation

## Overview

The table management system provides a comprehensive, scalable solution for displaying tabular data throughout the application. It offers both server-side rendered (components) and client-side interactive (islands) table implementations with consistent styling, responsive design, and specialized handling for different data types.

## Architecture Overview

The table system is organized into two main categories:

- **components/table/**: Server-side rendered table components for static data display
- **islands/table/**: Client-side interactive tables with dynamic behavior, pagination, and state management

## Core Components

### Server-Side Components (`components/table/`)

- **HoldersTable.tsx**: Wrapper component that combines pie chart visualization with tabular data display
- **src20DetailsTable/**: Specialized tables for SRC20 token data
  - **SRC20Mints.tsx**: Displays minting transactions and history
  - **SRC20Transfers.tsx**: Shows transfer transactions between addresses
- **stampDetailsTable/**: Specialized tables for Stamp data
  - **StampSales.tsx**: Displays sale transactions with pricing information
  - **StampTransfers.tsx**: Shows transfer transactions with quantity data
  - **StampListingsAll.tsx**: Comprehensive listing display for all dispensers
  - **StampListingsOpen.tsx**: Active/open listings only

### Interactive Islands (`islands/table/`)

- **DetailsTableBase.tsx**: Central orchestrator component managing tabbed interfaces and data fetching
- **HoldersTableBase.tsx**: Interactive table with infinite scroll and data pagination
- **HoldersPieChart.tsx**: Complementary pie chart visualization for holder data
- **UploadImageTable.tsx**: Specialized table for image upload workflows

## Integration Patterns

### Basic Server-Side Table Usage

```tsx
import { SRC20MintsTable } from "$components/table/src20DetailsTable/SRC20Mints.tsx";

<SRC20MintsTable
  mints={mintData}
  isLoading={false}
/>
```

### Interactive Table with Tabs

```tsx
import DetailsTableBase from "$islands/table/DetailsTableBase.tsx";

<DetailsTableBase
  type="src20"
  configs={[
    { id: "mints", label: "Mints", endpoint: "/api/mints" },
    { id: "transfers", label: "Transfers", endpoint: "/api/transfers" }
  ]}
  tick="PEPE"
  initialCounts={{ mints: 150, transfers: 89 }}
/>
```

### Holders Table with Visualization

```tsx
import { HoldersTable } from "$components/table/HoldersTable.tsx";

<HoldersTable
  holders={[
    { address: "bc1q...", balance: 1000, percentage: 25.5 },
    { address: "1A1z...", balance: 750, percentage: 19.2 }
  ]}
/>
```

## Table Types and Variants

### Required Properties

#### `type`: "stamps" | "src20" | "src101" | "vault"

Determines the data structure and rendering behavior for `DetailsTableBase`. Each type supports different tab configurations and API endpoints.

- **"stamps"**: Supports dispensers, sales, and transfers tabs
- **"src20"**: Supports mints and transfers tabs
- **"src101"**: Extended SRC20 functionality
- **"vault"**: Vault-specific data display

#### Data Properties

Different tables require specific data structures:

- **Mints**: `{ amt: number, destination: string, block_time: number, tx_hash: string, block_index: number }`
- **Transfers**: `{ creator: string, destination: string, amt: number, block_time: number, tx_hash: string }`
- **Sales**: `{ source: string, destination: string, dispense_quantity: number, satoshirate: number, block_time: number }`
- **Holders**: `{ address: string, balance: number, percentage: number }`

#### `isLoading?: boolean`

Controls loading state display across all table components. Shows appropriate empty states when `false` and no data is present.

### Optional Properties

#### `configs?: TabConfig[]`

For `DetailsTableBase` only. Defines tab structure and API endpoints:

```tsx
const configs = [
  {
    id: "mints",
    label: "Mints",
    endpoint: "/api/v2/src20/mints",
    countEndpoint: "/api/v2/src20/mints/count"
  }
];
```

#### `initialCounts?: Record<string, number>`

Pre-populates count badges for tabs, improving perceived performance.

#### `cpid?: string` | `tick?: string`

Entity identifiers passed to API endpoints for data filtering.

## Styling System

### Consistent Visual Design

All tables use a unified styling system with these core patterns:

#### Glassmorphism Effects

```tsx
// Applied to headers and rows
className={`${glassmorphismL2} group`}
```

#### Responsive Layout

- **Mobile**: Abbreviated addresses (4 characters), horizontal scroll
- **Tablet**: Extended addresses (6 characters), visible overflow
- **Desktop**: Full table visibility with sticky headers

#### Cell Styling Classes

```tsx
// Segmented row styling based on position
const rowClass = isFirst
  ? cellLeftL2Detail    // Rounded left corners
  : isLast
  ? cellRightL2Detail   // Rounded right corners
  : cellCenterL2Detail; // Center segments
```

#### Column Width Management

```tsx
// Standardized column group definitions
colGroup([
  { width: "min-w-[150px] w-auto" }, // FROM
  { width: "min-w-[150px] w-auto" }, // TO
  { width: "min-w-[125px] w-auto" }, // AMOUNT
])
```

#### ScrollContainer Integration

The `ScrollContainer` component from `$layout` provides enhanced scrolling behavior for interactive tables:

```tsx
import { ScrollContainer } from "$layout";

<ScrollContainer
  class="min-h-[80px] max-h-[290px] scrollbar-glassmorphism"
  onScroll={handleScroll}
>
  <div class="!-my-2 overflow-x-auto tablet:overflow-x-visible scrollbar-hide">
    <table class={`w-full border-separate border-spacing-y-2 ${textSm}`}>
      {/* Table content */}
    </table>
  </div>
</ScrollContainer>
```

**Key Features:**
- **Automatic Scrollbar Detection**: Dynamically adjusts padding based on scrollbar presence
- **Responsive Padding**: 16px on desktop, 24px on mobile when scrollbar is present
- **ResizeObserver Integration**: Monitors container size changes and adjusts padding accordingly
- **Event Handling**: Passes scroll events to parent components for infinite scroll implementation
- **Glassmorphism Styling**: Works seamlessly with `scrollbar-glassmorphism` class

**Usage Patterns:**
- **DetailsTableBase**: `min-h-[72px] max-h-[290px]` for tab content areas
- **HoldersTableBase**: `min-h-[80px] max-h-[290px]` for holder data with pie charts
- **StampListingsOpen**: `min-h-[76px] max-h-[244px]` for compact listing displays

### Typography System

- **Headers**: `labelXs` for consistent header styling
- **Content**: `textSm` for table body text
- **Links**: `valueSmLink` for interactive addresses and transaction hashes
- **Values**: `valueDarkSm` for numeric displays

## Advanced Features

### Infinite Scroll Implementation

```tsx
// Implemented in HoldersTableBase and DetailsTableBase
const handleScroll = (e: Event) => {
  const target = e.target as HTMLElement;
  const { scrollTop, scrollHeight, clientHeight } = target;

  if (scrollTop + clientHeight >= scrollHeight - 5 && hasMore && !isLoading) {
    loadMoreData();
  }
};
```

### Tab State Management

```tsx
// Centralized in DetailsTableBase
const [selectedTab, setSelectedTab] = useState<string>(
  configs.length > 0 ? configs[0].id : ""
);
const [tabData, setTabData] = useState<TabData>({});
```

### Data Transformation

```tsx
// Example: Mapping dispenser rates to dispense data
const mapDispensesWithRates = (dispenses: any[], dispensers: any[]) => {
  const dispenserRates = new Map(
    dispensers?.map((d) => [d.tx_hash, d.satoshirate]) ?? []
  );

  return dispenses?.map((dispense) => ({
    ...dispense,
    satoshirate: dispenserRates.get(dispense.dispenser_tx_hash) || 0,
  })) ?? [];
};
```

## Data Flow Patterns

### Server-Side Tables

1. Receive props with pre-fetched data
2. Apply consistent styling and layout
3. Render static HTML with responsive design
4. Handle empty states and loading indicators

### Interactive Islands

1. Initialize with configuration and initial data
2. Manage client-side state (pagination, tabs, loading)
3. Fetch additional data via API endpoints
4. Handle infinite scroll and user interactions
5. Update UI reactively based on state changes

## Performance Considerations

### Lazy Loading

- Tables implement infinite scroll to prevent large initial data loads
- Page size typically set to 16 items (`PAGE_SIZE = 16`)
- Data fetched incrementally as user scrolls

### Responsive Rendering

- Address abbreviation reduces content size on mobile
- Column widths optimized for different screen sizes
- Sticky headers only applied on desktop to prevent mobile layout issues

### Memory Management

- Old data retained for smooth scrolling experience
- State updates batched to prevent excessive re-renders
- Event handlers properly managed to prevent memory leaks

## Empty States and Error Handling

### Consistent Empty State Messages

```tsx
// Standardized across all table types
{!isLoading && (
  <tr>
    <td colSpan={headers?.length ?? 0} class={`w-full h-[34px] ${glassmorphismL2}`}>
      <h6 class={`${valueDarkSm} text-center`}>
        NO DATA AVAILABLE
      </h6>
    </td>
  </tr>
)}
```

### Loading State Indicators

- Integrated loading props across all components
- Prevents empty state flash during data fetching
- Consistent loading experience across table types

## Adding New Table Types

### Step 1: Define Data Interface

```typescript
// Add to lib/types/ui.d.ts
export interface NewTableProps {
  data: NewDataType[];
  isLoading?: boolean;
  customProp?: string;
}
```

### Step 2: Create Table Component

```tsx
// components/table/NewTable.tsx
export function NewTable({ data, isLoading = false }: NewTableProps) {
  const headers = ["COLUMN1", "COLUMN2", "COLUMN3"];

  return (
    <div class="-mt-2 overflow-x-auto tablet:overflow-x-visible scrollbar-hide">
      <table class={`w-full border-separate border-spacing-y-2 ${textSm}`}>
        {/* Standard table structure */}
      </table>
    </div>
  );
}
```

### Step 3: Add to DetailsTableBase (if applicable)

```tsx
// Add new case to renderTabContent()
case "newType":
  return (
    <NewTable
      data={tabData.newData || []}
      isLoading={isLoading}
    />
  );
```

### Step 4: Export from Index

```tsx
// Update appropriate index.ts file
export * from "./NewTable.tsx";
```

---

**Last Updated:** August 25, 2025
**Author:** Babalicious
