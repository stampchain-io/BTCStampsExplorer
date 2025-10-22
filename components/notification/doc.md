# Toast Notification System Documentation

## Overview

The Toast notification system provides a user-friendly way to display temporary notifications throughout the application. Built with Preact Signals for reactive state management, it offers consistent styling, smooth animations, and flexible configuration options.

## Core Components

- **styles.ts**: Style definitions for notification containers and variants
- **ToastComponent.tsx**: Individual toast notification rendering component
- **ToastProvider.tsx**: Toast state management and lifecycle handler
- **toastSignal.ts**: Global signal for triggering toasts from anywhere in the app
- **types**: Type definitions in `lib/types/ui.d.ts` and `lib/types/utils.d.ts`
- **doc.md**: This documentation

## Design System Integration

The Toast notification system follows the app's dark-themed glassmorphism design principles:

### Visual Styling
- **Border radius**: Large rounded corners (16px) - `rounded-2xl`
- **Backdrop blur**: Enhanced glassmorphism effect - `backdrop-blur-lg`
- **Shadow**: Consistent with app shadow system
- **Position**: Fixed top-left positioning with proper z-index layering
- **Colors**: Type-specific color palettes (grey, green, red) with gradient backgrounds

### Style Variants

#### Info Notifications
```typescript
bg-gradient-to-br from-color-neutral-dark/60 via-[#080708]/60 to-[#080708]/90
border-color-neutral-semidark/80
```

#### Success Notifications
```typescript
bg-gradient-to-br from-color-green-dark/60 via-[#080708]/60 to-[#080708]/90
border-color-green-semidark/80
```

#### Error/Warning Notifications
```typescript
bg-gradient-to-br from-color-red-dark/60 via-[#080708]/60 to-[#080708]/90
border-color-red-semidark/80
```

## Notification Types

The system supports **4 status message types** with distinct visual treatments:

| Type | Icon | Color | Duration | Auto-Dismiss | Use Case |
|------|------|-------|----------|--------------|----------|
| **info** | info | neutral `color-neutral` | 7000ms | ✅ Yes | General information, updates |
| **success** | success | green `color-green-semidark` | 3000ms | ✅ Yes | Successful operations |
| **warning** | info | red `color-red-semidark` | 7000ms | ✅ Yes | Warnings requiring attention |
| **error** | error | red `color-red-semidark` | 7000ms | ✅ Yes | Error messages |

### Type Characteristics

- **Info**: Uses grey color palette, longer duration for reading informational content
- **Success**: Quick confirmation with green palette, shorter duration for fast acknowledgment
- **Warning**: Combines info icon with error color scheme (red) for moderate urgency
- **Error**: Full error styling with error icon and red palette for critical messages

## Integration

### Global Setup

The `ToastProvider` is integrated at the root level in `routes/_app.tsx`, wrapping the main application content:

```tsx
<ToastProvider>
  <NavigatorProvider>
    {/* App content */}
  </NavigatorProvider>
</ToastProvider>
```

### Basic Usage

Import and call `showToast()` from anywhere in the application:

```tsx
import { showToast } from "$lib/utils/ui/notifications/toastSignal.ts";

// Info message (7000ms auto-dismiss)
showToast("Processing your request...", "info");

// Success message (3000ms auto-dismiss)
showToast("Transaction completed successfully!", "success");

// Warning message (7000ms auto-dismiss)
showToast("High network fees detected", "warning");

// Error message (7000ms auto-dismiss)
showToast("Failed to connect to wallet", "error");
```

### Multi-line Messages

The system supports multi-line messages with automatic formatting:

```tsx
showToast(
  "Transaction Submitted\nTxID: abc123...\nEstimated confirmation: 10 minutes",
  "success"
);
```

The first line is displayed in **bold** (`notificationHeading`), while subsequent lines use regular weight (`notificationBody`).

### Manual Dismiss Override

Disable auto-dismiss for messages requiring user acknowledgment:

```tsx
// Persistent message (requires manual close)
showToast("Please review these important terms", "info", false);

// Override default behavior for any type
showToast("Custom behavior message", "success", false);
```

## Features

### Auto-Dismiss with Progress Bar

- **Visual feedback**: Animated progress bar shows remaining time
- **Type-specific durations**:
  - Success: 3000ms (quick confirmations)
  - Info/Warning/Error: 7000ms (requires more reading time)
- **Smooth animations**: Progress bar uses linear animation
- **Color-coded**: Progress bar matches notification type color

### Manual Close

- **Close button**: Always available in center-right corner
- **Icon**: Uses Icon component with "close" name, grey color
- **Instant response**: Triggers notification-exit animation immediately
- **Accessible**: Proper ARIA labels and keyboard support

### Smooth Animations

Defined in `static/styles.css`:

#### notification-enter Animation (400ms)
```css
@keyframes notification-enter {
  from {
    transform: translateX(-100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
}
```

#### notification-exit Animation (400ms)
```css
@keyframes notification-exit {
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(--100%);
    opacity: 0;
  }
}
```

#### Progress Bar Animation
```css
@keyframes progress {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}
```

### State Management

The system uses **Preact Signals** for reactive state management:

1. **Global Signal**: `toastSignal` in `toastSignal.ts` acts as event bus
2. **Provider State**: `ToastProvider` maintains array of active toasts
3. **Lifecycle Management**: Automatic cleanup after animations complete
4. **Collision Prevention**: 50ms signal reset prevents rapid-fire duplicates

## Technical Implementation

### Architecture

```
┌─────────────────────────────────────────────┐
│           Application Code                  │
│  (Components, Islands, Routes, etc.)        │
└────────────────┬────────────────────────────┘
                 │ showToast()
                 ▼
┌─────────────────────────────────────────────┐
│         toastSignal (Global Signal)         │
│   Preact Signal for reactive updates        │
└────────────────┬────────────────────────────┘
                 │ subscribe
                 ▼
┌─────────────────────────────────────────────┐
│           ToastProvider                     │
│  - Subscribes to toastSignal                │
│  - Manages toast array state                │
│  - Handles auto-dismiss timers              │
│  - Coordinates animations                   │
└────────────────┬────────────────────────────┘
                 │ renders multiple
                 ▼
┌─────────────────────────────────────────────┐
│         ToastComponent (x N)                │
│  - Renders individual toast UI              │
│  - Handles manual close                     │
│  - Shows progress bar                       │
│  - Applies type-specific styling            │
└─────────────────────────────────────────────┘
```

### Component Responsibilities

#### `showToast()` Function
- **Purpose**: Public API for triggering notifications
- **Parameters**: `message`, `type`, `autoDismiss?`
- **Behavior**: Updates global signal, clears after 50ms
- **Location**: `lib/utils/ui/notifications/toastSignal.ts`

#### `ToastProvider`
- **Purpose**: State management and lifecycle orchestration
- **Features**:
  - Subscribes to global toast signal
  - Generates unique toast IDs
  - Manages duration and auto-dismiss logic
  - Coordinates notification-exit animations
  - Cleans up completed toasts
- **Location**: `islands/Toast/ToastProvider.tsx`

#### `ToastComponent`
- **Purpose**: Individual toast UI rendering
- **Features**:
  - Type-specific icon selection
  - Color scheme application
  - Multi-line message formatting
  - Progress bar rendering
  - Manual close handling
- **Location**: `islands/Toast/ToastComponent.tsx`

### Type Definitions

```typescript
// Base toast structure
export interface BaseToast {
  type: "success" | "error" | "warning" | "info";
  message: string;
  autoDismiss?: boolean;
}

// Internal toast with runtime state
export interface Toast extends Omit<BaseToast, "autoDismiss"> {
  id: string;
  duration: number;
  autoDismiss: boolean;
  isAnimatingOut?: boolean;
}

// Component props
export interface ToastComponentProps {
  id: string;
  message: string;
  type: "success" | "error" | "warning" | "info";
  onClose: () => void;
  autoDismiss: boolean;
  duration: number;
  isAnimatingOut?: boolean;
}
```

## Usage Examples

### Tool Error Messaging

```tsx
// In stamping tool
try {
  const result = await stampTransaction(data);
  showToast("Stamp created successfully!", "success");
} catch (error) {
  showToast(`Failed to create stamp\n${error.message}`, "error");
}
```

### Wallet Interactions

```tsx
// Connection status
showToast("Wallet connected successfully", "success");

// Transaction warnings
showToast(
  "High fees detected\nCurrent rate: 150 sat/vB\nConsider waiting for lower fees",
  "warning"
);
```

### Form Validation

```tsx
// Validation errors
showToast("Please fill in all required fields", "error");

// Success confirmations
showToast("Settings saved successfully", "success");
```

### Network Status

```tsx
// Connection issues
showToast(
  "Network connection lost\nRetrying...",
  "warning",
  false // Persistent until connection restored
);

// Reconnection
showToast("Connection restored", "success");
```

## Accessibility Features

- **ARIA roles**: Toast container uses `role="alert"` for screen readers
- **ARIA labels**: Icons have descriptive labels like "error notification"
- **Keyboard support**: Close button is keyboard accessible
- **Visual indicators**: Color, icon, and animation provide multiple cues
- **Readable durations**: Sufficient time to read messages (3-7 seconds)
- **Manual override**: Option to disable auto-dismiss for complex messages

## Performance Considerations

- **Efficient rendering**: Only active toasts are rendered
- **Cleanup**: Automatic removal after animations complete
- **Signal optimization**: 50ms debounce prevents rapid duplicates
- **Animation performance**: CSS animations use GPU-accelerated transforms
- **Memory management**: Completed toasts are removed from state array

## Future Enhancements

As outlined in [Issue #860](https://github.com/stampchain-io/BTCStampsExplorer/issues/860):

### Planned Improvements

1. **Global Message Strings**
   - Refactor to centralized message file for easier maintenance
   - Consistent messaging across the application
   - Easier localization support

2. **Update Notifications**
   - Display "update" messages when app is updated
   - Inform users about new features
   - Show on initial open after update

3. **Transaction Confirmations**
   - Real-time transaction status updates
   - Confirmation notifications when transactions complete
   - Display on wallet connection if confirmations occurred while disconnected

4. **Naming Refactor**
   - Consider renaming "Toast" folders/files to "notification"
   - Improve consistency with component naming conventions

5. **Enhanced Tool Integration**
   - Move all tool error messaging to toast notifications
   - Review info messages for manual dismissal requirements
   - Standardize MARA message handling

## Related Components

- **Icon System**: Uses `$icon` for notification icons ([icon/doc.md](mdc:components/icon/doc.md))
- **Layout System**: Follows glassmorphism design principles ([layout/doc.md](mdc:components/layout/doc.md))
- **Notification Styles**: Style definitions in `components/notification/styles.ts`
- **Global Styles**: Animation keyframes in `static/styles.css`

## Best Practices

### Message Content
- **Be concise**: First line should summarize the message
- **Provide context**: Use additional lines for details when needed
- **Action-oriented**: Tell users what happened and what to do next
- **Consistent tone**: Match message style to notification type

### Type Selection
- **Info**: General updates, status changes, informational content
- **Success**: Confirmations of completed actions
- **Warning**: Non-critical issues requiring attention
- **Error**: Failed operations, critical issues

### Duration Considerations
- **Success**: 3000ms is sufficient for quick confirmations
- **Others**: 7000ms allows time to read detailed messages
- **Manual dismiss**: Use `autoDismiss: false` for:
  - Complex multi-step instructions
  - Critical information requiring acknowledgment
  - Persistent status indicators

### Multiple Toasts
- The system supports multiple simultaneous toasts
- Each toast has a unique ID and independent lifecycle
- Toasts stack vertically in the top-left corner
- Consider user experience when triggering multiple toasts rapidly

---

**Last Updated:** October 6, 2025
**Author:** baba
