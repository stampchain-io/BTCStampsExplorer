# Fee Indicators Component Library

## 📚 Complete Component Reference

This library provides a comprehensive set of reusable components for displaying progressive fee estimation indicators across transaction tools in BTCStampsExplorer.

## 🎯 Quick Start

```bash
# Import the components you need
import { 
  SimplePhaseIndicator,
  ProgressiveFeeStatusIndicator,
  InlinePhaseIndicator 
} from "$lib/components/fee-indicators";

# Import hooks
import { useTransactionFeeEstimator } from "$lib/hooks/useTransactionFeeEstimator";

# Import utilities
import { mapProgressiveFeeDetails } from "$lib/utils/fee-estimation-utils";
```

## 🏗️ Architecture Overview

```
fee-indicators/
├── Components/
│   ├── PhaseIndicator.tsx       # Core indicator components
│   ├── PhaseIndicatorGroup.tsx  # Grouped indicators
│   └── ThemeProvider.tsx        # CSS custom properties
├── Utilities/
│   ├── AnimationConstants.ts    # Animation values
│   ├── AnimationUtilities.ts    # Animation helpers
│   ├── StyleConstants.ts        # Colors & spacing
│   └── FeeDetailsMapper.ts      # Data mapping
├── Hooks/
│   ├── useFeeAnimations.ts      # Animation controls
│   ├── useFeeIndicatorState.ts  # State management
│   └── useFeeTheme.ts           # Theme management
├── Types/
│   ├── types.ts                 # Core interfaces
│   └── generics.ts              # Generic types for tools
└── Examples/
    ├── PropsPatternExample.tsx   # Simple integration
    ├── ComponentPatternExample.tsx # Modal integration
    └── InlinePatternExample.tsx  # Advanced integration
```

## 🧩 Core Components

### PhaseIndicator
Individual phase dot with animations.

```tsx
<PhaseIndicator
  phase="instant"
  isActive={true}
  isComplete={false}
  hasError={false}
  size="md"
  showLabel={true}
/>
```

### PhaseDot
Simplified dot indicator without animations.

```tsx
<PhaseDot
  active={true}
  animating={false}
  color="green"
  title="Phase 1: Instant estimate"
/>
```

### PhaseStatusText
Text representation of current phase.

```tsx
<PhaseStatusText
  currentPhase="instant"
  className="text-xs"
/>
// Output: ⚡ Instant
```

### SimplePhaseIndicator
Minimal 3-dot indicator for Props Pattern tools.

```tsx
<SimplePhaseIndicator
  phase1Result={phase1Result}
  phase2Result={phase2Result}
  phase3Result={phase3Result}
/>
```

### PhaseIndicatorSummary
Complete phase summary with error handling.

```tsx
<PhaseIndicatorSummary
  phase1Result={phase1Result}
  phase2Result={phase2Result}
  phase3Result={phase3Result}
  currentPhase="cached"
  isPreFetching={true}
  showError={hasError}
  onClearError={clearError}
/>
```

### ProgressiveFeeStatusIndicator
Full-featured status indicator for Component Pattern.

```tsx
<ProgressiveFeeStatusIndicator
  isConnected={true}
  isSubmitting={false}
  currentPhase="cached"
  phase1Result={phase1Result}
  phase2Result={phase2Result}
  phase3Result={phase3Result}
  isPreFetching={true}
  feeEstimationError={null}
  clearError={() => {}}
/>
```

### InlinePhaseIndicator
Advanced inline indicator for Inline Pattern (StampingTool style).

```tsx
<InlinePhaseIndicator
  currentPhase="exact"
  phase1Result={phase1Result}
  phase2Result={phase2Result}
  phase3Result={phase3Result}
  isPreFetching={false}
  isEstimating={true}
  isConnected={true}
  isSubmitting={true}
  feeEstimationError={null}
  clearError={() => {}}
  className="absolute top-3 right-3 z-10"
/>
```

## 🎨 Styling System

### Colors
```typescript
FEE_INDICATOR_COLORS = {
  instant: "rgb(74, 222, 128)",   // green-400
  cached: "rgb(96, 165, 250)",    // blue-400
  exact: "rgb(251, 146, 60)",     // orange-400
  success: "rgb(34, 197, 94)",    // green-500
  error: "rgb(239, 68, 68)",      // red-500
  loading: "rgb(156, 163, 175)",  // gray-400
}
```

### Spacing
```typescript
FEE_INDICATOR_SPACING = {
  sm: { indicator: "0.25rem", gap: "0.25rem", padding: "0.5rem" },
  md: { indicator: "0.375rem", gap: "0.5rem", padding: "0.75rem" },
  lg: { indicator: "0.5rem", gap: "0.75rem", padding: "1rem" }
}
```

### Animation Timings
```typescript
ANIMATION_TIMINGS = {
  fast: "150ms",
  normal: "300ms",
  slow: "600ms",
  pulse: "2s",
  ping: "1s"
}
```

## 🪝 Hooks

### useFeeAnimations
Manages animations for fee indicators.

```tsx
const { 
  applyAnimation, 
  prefersReducedMotion,
  getAnimationClasses,
  isAnimating 
} = useFeeAnimations({
  enablePulse: true,
  enablePing: true
});

// Apply animation to element
applyAnimation(element, "pulse");
```

### useFeeIndicatorState
Manages phase state and transitions.

```tsx
const {
  phaseState,
  setPhase,
  getPhaseStatus,
  error,
  setError,
  clearError,
  completionPercentage
} = useFeeIndicatorState({
  initialPhase: "instant",
  errorClearDelay: 5000
});
```

### useFeeTheme
Manages theming and CSS custom properties.

```tsx
const {
  theme,
  cssProperties,
  applyTheme,
  getPhaseColor,
  getTiming
} = useFeeTheme({
  theme: customTheme,
  applyToRoot: true
});
```

## 📋 Implementation Patterns

### Pattern 1: Props Pattern (Simple)
Best for tools using FeeCalculatorBase directly.

```tsx
// 1. Use the hook
const { phase1Result, phase2Result, phase3Result } = useTransactionFeeEstimator({...});

// 2. Add simple indicator
<SimplePhaseIndicator
  phase1Result={phase1Result}
  phase2Result={phase2Result}
  phase3Result={phase3Result}
/>

// 3. Pass to FeeCalculatorBase
<FeeCalculatorBase
  {...otherProps}
  phase1Result={phase1Result}
  phase2Result={phase2Result}
  phase3Result={phase3Result}
/>
```

### Pattern 2: Component Pattern (Modal)
Best for tools with custom modals.

```tsx
// 1. Use the hook
const { ...feeData } = useTransactionFeeEstimator({...});

// 2. Add to modal with absolute positioning
<div className="relative">
  {/* Modal content */}
  <ProgressiveFeeStatusIndicator
    {...feeData}
    className="absolute top-3 right-3"
  />
</div>
```

### Pattern 3: Inline Pattern (Advanced)
Best for tools needing full control (StampingTool style).

```tsx
// 1. Use the hook with all options
const { ...feeData } = useTransactionFeeEstimator({...});

// 2. Position inline indicator
<div className="relative">
  <FeeCalculatorBase {...props} />
  <InlinePhaseIndicator
    {...feeData}
    className="absolute top-3 right-3 z-10"
  />
</div>
```

## 🔧 TypeScript Support

### Generic Tool Props
```typescript
interface GenericFeeIndicatorProps<T extends ToolType> {
  toolConfig: ToolConfig<T>;
  currentPhase?: "instant" | "cached" | "exact";
  phase1Result?: ProgressiveFeeEstimationResult | null;
  // ... other props
}
```

### Tool-Specific Props
```typescript
// Stamp tool
interface StampToolProps extends GenericFeeIndicatorProps<"stamp"> {
  file?: File | null;
  issuance?: number;
}

// SRC-20 tool
interface SRC20ToolProps extends GenericFeeIndicatorProps<"src20"> {
  ticker?: string;
  operation?: "deploy" | "mint" | "transfer";
}
```

### Type Guards
```typescript
if (isToolProps(props, "stamp")) {
  // props is StampToolProps
  console.log(props.file);
}
```

## 🧪 Testing

### Required Test Attributes
```tsx
<div data-testid="fee-phase-indicator" data-phase={currentPhase}>
  <div data-testid="phase-dot-instant" />
  <div data-testid="phase-dot-cached" />
  <div data-testid="phase-dot-exact" />
</div>
```

### Visual Testing
```typescript
// Test animation timings
expect(element).toHaveStyle({
  transitionDuration: "300ms"
});

// Test phase colors
expect(phaseDot).toHaveStyle({
  backgroundColor: "rgb(74, 222, 128)"
});
```

## 📦 Bundle Size

- Core components: ~8KB gzipped
- With animations: ~10KB gzipped
- Full library: ~15KB gzipped

## 🚀 Performance

- CSS animations for optimal performance
- Conditional rendering to reduce DOM nodes
- Memoized calculations in hooks
- Debounced state updates

## 🌐 Browser Support

- Chrome/Edge: Full support
- Firefox: Full support
- Safari: Full support (with -webkit prefixes)
- Mobile: Full support with touch optimizations

## 📝 Migration Guide

### From Custom Implementation
```tsx
// Before
<div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />

// After
<PhaseDot active={true} animating={true} color="green" title="Instant" />
```

### From Hardcoded Values
```tsx
// Before
style={{ transition: "all 300ms ease" }}

// After
import { ANIMATION_TIMINGS } from "$lib/components/fee-indicators";
style={{ transitionDuration: ANIMATION_TIMINGS.normal }}
```

## 🤝 Contributing

1. Follow existing component patterns
2. Include TypeScript types
3. Add JSDoc comments
4. Include usage examples
5. Test across different contexts

## 📚 Resources

- [StampingTool Reference](../../../islands/tool/stamp/StampingTool.tsx)
- [Progressive Fee Estimation Docs](../../docs/progressive-fee-estimation-reference-implementation.md)
- [Animation Guidelines](./AnimationConstants.ts)
- [Theme Configuration](./StyleConstants.ts)

---

*Component Library v1.0.0 - Based on StampingTool reference implementation*