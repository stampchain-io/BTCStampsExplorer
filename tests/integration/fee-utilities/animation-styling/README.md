# FairmintTool Animation & Styling Integration Tests

## Overview

This test suite validates the integration of shared animation constants and styling constants from Task 18 with the FairmintTool. The tests ensure that shared utilities work correctly without impacting performance or breaking existing functionality.

## Test Structure

```
tests/integration/fee-utilities/animation-styling/
├── fairmint-animation.test.ts      # Main test suite
├── baseline-measurements.ts        # Performance baseline utilities
├── visual-regression/              # Screenshot comparisons
│   ├── baselines/                  # Baseline screenshots
│   └── current/                    # Current test screenshots
└── README.md                       # This file
```

## Test Categories

### 1. Animation Timing Tests
- **Purpose**: Validate shared animation timing constants
- **Tests**:
  - Transition duration accuracy (300ms ± 50ms tolerance)
  - Easing function application from shared constants
  - Phase transition smoothness

### 2. Styling Constants Tests
- **Purpose**: Ensure shared color and spacing constants work correctly
- **Tests**:
  - Phase indicator colors (green-400, blue-400, orange-400)
  - Spacing consistency across components
  - CSS custom properties application

### 3. Visual Regression Tests
- **Purpose**: Prevent visual breaking changes
- **Tests**:
  - Screenshot comparison across fee states
  - Responsive design validation
  - Theme consistency checks

### 4. Performance Impact Tests
- **Purpose**: Ensure no performance degradation
- **Tests**:
  - Render time comparison
  - Memory usage monitoring
  - Animation performance validation

## Running Tests

### Prerequisites
```bash
# Install Playwright
deno task test:install

# Ensure FairmintTool is accessible
deno task dev
```

### Run All Tests
```bash
deno task test:integration:fee-utilities:animation
```

### Run Specific Test Categories
```bash
# Animation timing only
deno task test:integration --grep "animation timing"

# Visual regression only
deno task test:integration --grep "visual consistency"

# Performance only
deno task test:integration --grep "performance"
```

## Test Data & Baselines

### Performance Baselines
- Stored in `tests/baselines/fee-utilities/`
- Auto-generated on first run
- Updated manually when performance improvements are made

### Visual Baselines
- Screenshot baselines in `visual-regression/baselines/`
- Compared against current screenshots
- Threshold: 20% difference tolerance

## Integration Requirements

### For Other Agent (FairmintTool Integration)

The other agent should implement these changes to FairmintTool:

#### 1. Animation Constants Integration
```typescript
// Import shared constants
import { ANIMATION_TIMINGS } from "$lib/components/fee-indicators/AnimationConstants.ts";

// Apply to fee estimation transitions
const transitionStyle = {
  transitionDuration: ANIMATION_TIMINGS.normal, // 300ms
  transitionTimingFunction: EASING_FUNCTIONS.smooth,
};
```

#### 2. Styling Constants Integration
```typescript
// Import shared styling
import { FEE_INDICATOR_COLORS } from "$lib/components/fee-indicators/StyleConstants.ts";

// Apply phase colors
const phaseStyles = {
  instant: { backgroundColor: FEE_INDICATOR_COLORS.instant },
  cached: { backgroundColor: FEE_INDICATOR_COLORS.cached },
  exact: { backgroundColor: FEE_INDICATOR_COLORS.exact },
};
```

#### 3. Required Test Attributes
Add these data attributes for testing:
```tsx
<div data-testid="fairmint-tool">
  <div data-testid="fee-calculator">
    <div data-phase="instant" data-testid="fee-phase-indicator">
      {/* Phase indicator content */}
    </div>
  </div>
  <button data-testid="connect-wallet-button">Connect Wallet</button>
</div>
```

#### 4. CSS Custom Properties
Ensure CSS custom properties are available:
```css
:root {
  --fee-indicator-instant-color: rgb(74, 222, 128);
  --fee-indicator-cached-color: rgb(96, 165, 250);
  --fee-indicator-exact-color: rgb(251, 146, 60);
}
```

## Expected Outcomes

### Success Criteria
- ✅ All animation timing tests pass (300ms ± 50ms)
- ✅ All styling constants applied correctly
- ✅ No visual regression detected
- ✅ No performance degradation >5%
- ✅ All test attributes present and functional

### Failure Scenarios
- ❌ Animation timing outside tolerance range
- ❌ Incorrect colors applied to phase indicators
- ❌ Visual differences >20% threshold
- ❌ Performance regression >5%
- ❌ Missing test attributes or broken selectors

## Troubleshooting

### Common Issues

#### Animation Tests Failing
```bash
# Check if FairmintTool has proper transitions
# Verify ANIMATION_TIMINGS import
# Ensure CSS transitions are applied
```

#### Visual Regression Failures
```bash
# Update baselines if changes are intentional
deno task test:integration:update-baselines

# Check viewport consistency
# Verify screenshot timing
```

#### Performance Regression
```bash
# Check for memory leaks
# Verify animation performance
# Compare against baseline metrics
```

### Debug Mode
```bash
# Run tests with debug output
DEBUG=1 deno task test:integration:fee-utilities:animation

# Generate detailed performance reports
PERFORMANCE_REPORT=1 deno task test:integration:fee-utilities:animation
```

## Next Steps

After Task 22.1 completion:
1. **Task 22.2**: Fee mapping helpers with SRC-101 RegisterTool
2. **Task 22.3**: Performance impact assessment across tools
3. **Task 22.4**: Create real integration examples documentation

## Contributing

When adding new tests:
1. Follow existing test patterns
2. Add appropriate data attributes to components
3. Update baselines when making intentional changes
4. Document new test scenarios in this README
