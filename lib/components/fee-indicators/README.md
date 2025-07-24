# Fee Indicators Component Library

## Overview

This library provides reusable components for displaying progressive fee estimation indicators across transaction tools in BTCStampsExplorer. Based on the StampingTool reference implementation, these components offer consistent UI/UX for the three-phase fee estimation system.

## Architecture

### Core Components

#### 1. Phase Indicators
- `PhaseIndicator` - Individual phase dot with animations
- `PhaseDot` - Simplified dot indicator
- `PhaseStatusText` - Text representation of current phase
- `PhaseIndicatorGroup` - Group of phase indicators
- `PhaseIndicatorSummary` - Complete 3-dot summary view
- `InlinePhaseIndicator` - Full inline implementation (StampingTool pattern)
- `SimplePhaseIndicator` - Minimal implementation for Props pattern tools

#### 2. Status Indicators
- `ProgressiveFeeStatusIndicator` - Complete status display component
- `ActivePhaseIndicator` - Animated indicator for active phases
- `CompactFeePhaseIndicator` - Space-efficient version

#### 3. Animation Utilities
- `AnimationConstants` - Timing and easing constants
- `AnimationUtilities` - Helper functions for animations
- `PHASE_TRANSITIONS` - Phase-specific transition configs

#### 4. Styling System
- `StyleConstants` - Colors, spacing, and theme values
- `ThemeProvider` - CSS custom properties generation
- `FEE_INDICATOR_COLORS` - Standardized color palette
- `FEE_INDICATOR_SPACING` - Consistent spacing system

#### 5. Utility Components
- `FeeDetailsMapper` - Maps fee data to component props
- TypeScript interfaces for type safety

## Usage Patterns

### Pattern 1: Props Pattern (Simple Tools)
Used by: FairmintTool, SRC-101 RegisterTool

```tsx
import { SimplePhaseIndicator } from "$lib/components/fee-indicators";

<SimplePhaseIndicator
  phase1Result={phase1Result}
  phase2Result={phase2Result}
  phase3Result={phase3Result}
/>
```

### Pattern 2: Component Pattern (Modal Tools)
Used by: Trade tools, complex minting tools

```tsx
import { ProgressiveFeeStatusIndicator } from "$components/fee/ProgressiveFeeStatusIndicator";

<ProgressiveFeeStatusIndicator
  isConnected={!!wallet}
  isSubmitting={isSubmitting}
  currentPhase={currentPhase}
  phase1Result={phase1Result}
  phase2Result={phase2Result}
  phase3Result={phase3Result}
  isPreFetching={isPreFetching}
  feeEstimationError={error}
  clearError={clearError}
/>
```

### Pattern 3: Inline Pattern (Advanced Tools)
Used by: StampingTool

```tsx
import { InlinePhaseIndicator } from "$lib/components/fee-indicators";

<InlinePhaseIndicator
  currentPhase={currentPhase}
  phase1Result={phase1Result}
  phase2Result={phase2Result}
  phase3Result={phase3Result}
  isPreFetching={isPreFetching}
  isEstimating={isEstimating}
  isConnected={!!wallet}
  isSubmitting={isSubmitting}
  feeEstimationError={error}
  clearError={clearError}
/>
```

## Component API

### PhaseIndicator Props
```typescript
interface PhaseIndicatorProps {
  phase: "instant" | "cached" | "exact";
  isActive?: boolean;
  isComplete?: boolean;
  hasError?: boolean;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
  className?: string;
  children?: ComponentChildren;
}
```

### ProgressiveFeeStatusIndicator Props
```typescript
interface ProgressiveFeeStatusIndicatorProps {
  isConnected: boolean;
  isSubmitting: boolean;
  currentPhase: "instant" | "cached" | "exact";
  phase1Result: ProgressiveFeeEstimationResult | null;
  phase2Result: ProgressiveFeeEstimationResult | null;
  phase3Result: ProgressiveFeeEstimationResult | null;
  isPreFetching: boolean;
  feeEstimationError: string | null;
  clearError?: () => void;
  className?: string;
}
```

## Theming

### CSS Custom Properties
The library generates CSS custom properties for consistent theming:

```css
:root {
  --fee-indicator-color-instant: rgb(74, 222, 128);
  --fee-indicator-color-cached: rgb(96, 165, 250);
  --fee-indicator-color-exact: rgb(251, 146, 60);
  --fee-indicator-timing-normal: 300ms;
  --fee-indicator-timing-fast: 150ms;
  --fee-indicator-easing-smooth: cubic-bezier(0.4, 0, 0.2, 1);
}
```

### Using the Theme Provider
```tsx
import { generateCSSCustomProperties } from "$lib/components/fee-indicators/StyleConstants";

const cssProperties = generateCSSCustomProperties(DEFAULT_FEE_INDICATOR_THEME);
```

## Animation System

### Available Timings
- `fast`: 150ms - Quick feedback
- `normal`: 300ms - Standard transitions
- `slow`: 600ms - Emphasis animations
- `pulse`: 2s - Loading indicators
- `ping`: 1s - Attention grabbers

### Easing Functions
- `ease`: Standard ease
- `easeInOut`: Smooth transitions
- `spring`: Delightful interactions
- `linear`: Progress indicators

## Best Practices

1. **Choose the Right Pattern**
   - Use Props Pattern for simple tools with FeeCalculatorBase
   - Use Component Pattern for tools with custom modals
   - Use Inline Pattern for advanced tools needing full control

2. **Maintain Consistency**
   - Always use shared animation constants
   - Apply standardized colors from the palette
   - Follow spacing guidelines

3. **Handle Edge Cases**
   - Provide fallbacks for missing data
   - Handle error states gracefully
   - Consider mobile viewports

4. **Performance**
   - Use CSS animations over JavaScript
   - Conditionally render indicators
   - Memoize expensive calculations

## Testing

### Required Test Attributes
```tsx
<div data-testid="fee-phase-indicator" data-phase={currentPhase}>
  {/* Phase content */}
</div>
```

### Visual Testing
- Ensure animations work at different speeds
- Test responsive behavior
- Verify color contrast accessibility

## Migration Guide

### From Custom Implementation
```tsx
// Before
<div className="w-1.5 h-1.5 bg-green-400 rounded-full" />

// After
import { PhaseDot } from "$lib/components/fee-indicators";
<PhaseDot active={true} color="green" title="Instant" />
```

### From Hardcoded Values
```tsx
// Before
<div style={{ transition: "all 300ms ease" }}>

// After
import { ANIMATION_TIMINGS } from "$lib/components/fee-indicators";
<div style={{ transitionDuration: ANIMATION_TIMINGS.normal }}>
```

## Examples

See implementations in:
- `/islands/tool/stamp/StampingTool.tsx` - Inline Pattern
- `/islands/tool/fairmint/FairmintTool.tsx` - Props Pattern
- `/islands/tool/src101/RegisterTool.tsx` - Props Pattern

## Contributing

When adding new components:
1. Follow existing patterns and conventions
2. Include TypeScript types
3. Add comprehensive documentation
4. Include usage examples
5. Test across different contexts

---

*Based on StampingTool reference implementation - Task 10.4*