/**
 * UI Component Types Module
 *
 * Comprehensive type definitions for UI components in the BTC Stamps Explorer
 * Built for Fresh framework with Preact components
 *
 * Domain: User Interface Components
 * Framework: Fresh 1.7.3, Preact 10.22.0
 * Usage: Import UI component types and interfaces
 */

import type { ComponentChildren, ComponentProps, JSX } from "preact";
import type * as preact from "preact";

// =============================================================================
// CORE UI FRAMEWORK TYPES
// =============================================================================

/**
 * Base component props that all UI components should extend
 */
export interface BaseComponentProps {
  /** Additional CSS classes */
  class?: string;
  /** Additional CSS classes (React-style alias) */
  className?: string;
  /** Component children */
  children?: ComponentChildren;
  /** Data attributes for testing and tracking */
  "data-testid"?: string;
  /** Custom data attributes */
  [key: `data-${string}`]: unknown;
}

/**
 * Extended base props with common HTML attributes
 */
export interface ExtendedComponentProps extends BaseComponentProps {
  /** Element ID */
  id?: string;
  /** Inline styles */
  style?: JSX.CSSProperties;
  /** ARIA role */
  role?: JSX.AriaRole;
  /** ARIA label */
  "aria-label"?: string;
  /** ARIA labelledby */
  "aria-labelledby"?: string;
  /** ARIA describedby */
  "aria-describedby"?: string;
  /** Tab index */
  tabIndex?: number;
}

// =============================================================================
// THEME AND DESIGN SYSTEM TYPES
// =============================================================================

/**
 * Color palette definition for the design system
 */
export interface ColorPalette {
  // Primary colors
  primary: {
    50: string;
    100: string;
    200: string;
    300: string;
    400: string;
    500: string;
    600: string;
    700: string;
    800: string;
    900: string;
  };

  // Bitcoin Stamps brand colors
  stamp: {
    purple: string;
    "purple-dark": string;
    "purple-light": string;
    "purple-highlight": string;
    grey: string;
    "grey-dark": string;
    "grey-light": string;
  };

  // Semantic colors
  semantic: {
    success: string;
    warning: string;
    error: string;
    info: string;
  };

  // Neutral colors
  neutral: {
    white: string;
    black: string;
    transparent: string;
  };
}

/**
 * Typography scale definition
 */
export interface Typography {
  fontFamily: {
    sans: string[];
    mono: string[];
  };
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    "2xl": string;
    "3xl": string;
    "4xl": string;
  };
  fontWeight: {
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
  letterSpacing: {
    tight: string;
    normal: string;
    wide: string;
    wider: string;
  };
}

/**
 * Spacing scale definition
 */
export interface SpacingScale {
  0: string;
  1: string;
  2: string;
  3: string;
  4: string;
  5: string;
  6: string;
  8: string;
  10: string;
  12: string;
  16: string;
  20: string;
  24: string;
  32: string;
  40: string;
  48: string;
  56: string;
  64: string;
}

/**
 * Responsive breakpoints
 */
export interface Breakpoints {
  mobileSm: string; // 360px+
  mobileMd: string; // 568px+
  mobileLg: string; // 768px+
  tablet: string; // 1024px+
  desktop: string; // 1440px+
}

/**
 * Animation and transition definitions
 */
export interface Transitions {
  duration: {
    fast: string;
    normal: string;
    slow: string;
  };
  easing: {
    "ease-in": string;
    "ease-out": string;
    "ease-in-out": string;
  };
}

/**
 * Complete theme definition
 */
export interface Theme {
  colors: ColorPalette;
  spacing: SpacingScale;
  typography: Typography;
  breakpoints: Breakpoints;
  transitions: Transitions;
}

// =============================================================================
// LAYOUT AND GRID TYPES
// =============================================================================

/**
 * Flexbox layout props
 */
export interface FlexboxProps {
  /** Flex direction */
  direction?: "row" | "column" | "row-reverse" | "column-reverse";
  /** Justify content */
  justify?: "start" | "end" | "center" | "between" | "around" | "evenly";
  /** Align items */
  align?: "start" | "end" | "center" | "stretch" | "baseline";
  /** Flex wrap */
  wrap?: "nowrap" | "wrap" | "wrap-reverse";
  /** Gap between items */
  gap?: keyof SpacingScale;
}

/**
 * Grid layout props
 */
export interface GridProps {
  /** Number of columns */
  cols?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12;
  /** Number of rows */
  rows?: 1 | 2 | 3 | 4 | 5 | 6;
  /** Gap between grid items */
  gap?: keyof SpacingScale;
  /** Column gap */
  gapX?: keyof SpacingScale;
  /** Row gap */
  gapY?: keyof SpacingScale;
}

/**
 * Container props for layout components
 */
export interface ContainerProps extends ExtendedComponentProps {
  /** Maximum width */
  maxWidth?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "full";
  /** Padding */
  padding?: keyof SpacingScale;
  /** Margin */
  margin?: keyof SpacingScale;
  /** Center content */
  center?: boolean;
}

/**
 * Display count breakpoints for responsive components
 */
export interface DisplayCountBreakpoints {
  mobileSm: number; // 360px+
  mobileMd?: number; // 568px+
  mobileLg: number; // 768px+
  tablet: number; // 1024px+
  desktop: number; // 1440px+
}

// =============================================================================
// BUTTON COMPONENT TYPES
// =============================================================================

/**
 * Button variant types from existing system
 */
export type ButtonVariant =
  | "text"
  | "flat"
  | "outline"
  | "flatOutline"
  | "outlineFlat"
  | "outlineGradient";

/**
 * Button color types from existing system
 */
export type ButtonColor =
  | "grey"
  | "greyDark"
  | "greyGradient"
  | "purple"
  | "purpleDark"
  | "purpleGradient"
  | "test"
  | "custom";

/**
 * Button size types from existing system
 */
export type ButtonSize =
  | "xxs"
  | "xs"
  | "sm"
  | "md"
  | "lg"
  | "xl"
  | "xxsR"
  | "xsR"
  | "smR"
  | "mdR"
  | "lgR";

/**
 * Base button props interface
 */
export interface BaseButtonProps extends ExtendedComponentProps {
  /** Button variant style */
  variant: ButtonVariant;
  /** Button color scheme */
  color: ButtonColor;
  /** Button size */
  size: ButtonSize;
  /** Disabled state */
  disabled?: boolean;
  /** Loading state */
  isLoading?: boolean;
  /** Active state */
  isActive?: boolean;
  /** Button type for form submission */
  type?: "button" | "submit" | "reset";
  /** Click handler */
  onClick?: JSX.MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>;
  /** Mouse enter handler */
  onMouseEnter?: JSX.MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>;
  /** Mouse leave handler */
  onMouseLeave?: JSX.MouseEventHandler<HTMLButtonElement | HTMLAnchorElement>;
  /** Focus handler */
  onFocus?: JSX.FocusEventHandler<HTMLButtonElement | HTMLAnchorElement>;
  /** Blur handler */
  onBlur?: JSX.FocusEventHandler<HTMLButtonElement | HTMLAnchorElement>;
}

/**
 * Button element props (button tag)
 */
export interface ButtonElementProps extends BaseButtonProps {
  href?: undefined;
  "f-partial"?: undefined;
  target?: undefined;
}

/**
 * Anchor element props (link that looks like button)
 */
export interface AnchorElementProps extends BaseButtonProps {
  /** Link href */
  href: string;
  /** Fresh partial navigation */
  "f-partial"?: string;
  /** Link target */
  target?: "_blank" | "_self" | "_parent" | "_top";
}

/**
 * Union type for button props
 */
export type ButtonProps = ButtonElementProps | AnchorElementProps;

/**
 * Icon button specific props
 */
export interface IconButtonProps extends BaseButtonProps {
  /** Icon element */
  icon: ComponentChildren;
  /** Loading state */
  isLoading?: boolean;
  /** Link properties */
  href?: string;
  "f-partial"?: string;
  target?: "_blank" | "_self" | "_parent" | "_top";
}

/**
 * Processing button props for forms
 */
export interface ProcessingButtonProps extends BaseButtonProps {
  /** Form submission state */
  isSubmitting: boolean;
  /** Link properties */
  href?: string;
  "f-partial"?: string;
  target?: "_blank" | "_self" | "_parent" | "_top";
}

// =============================================================================
// FORM COMPONENT TYPES
// =============================================================================

/**
 * Base form control props
 */
export interface FormControlProps extends ExtendedComponentProps {
  /** Field name */
  name: string;
  /** Field label */
  label?: string;
  /** Field placeholder */
  placeholder?: string;
  /** Required field */
  required?: boolean;
  /** Disabled state */
  disabled?: boolean;
  /** Error message */
  error?: string;
  /** Help text */
  help?: string;
  /** Field value */
  value?: string | number;
  /** Change handler */
  onChange?: (
    event: JSX.TargetedEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement,
      Event
    >,
  ) => void;
}

/**
 * Input field props
 */
export interface InputProps extends FormControlProps {
  /** Input type */
  type?: "text" | "email" | "password" | "number" | "search" | "url" | "tel";
  /** Minimum value (for number inputs) */
  min?: number;
  /** Maximum value (for number inputs) */
  max?: number;
  /** Step value (for number inputs) */
  step?: number;
  /** Input pattern */
  pattern?: string;
}

/**
 * Select field props
 */
export interface SelectProps extends FormControlProps {
  /** Select options */
  options: Array<{
    value: string | number;
    label: string;
    disabled?: boolean;
  }>;
  /** Multiple selection */
  multiple?: boolean;
}

/**
 * Textarea props
 */
export interface TextareaProps extends FormControlProps {
  /** Number of rows */
  rows?: number;
  /** Number of columns */
  cols?: number;
  /** Resize behavior */
  resize?: "none" | "vertical" | "horizontal" | "both";
}

// =============================================================================
// MODAL AND DIALOG TYPES
// =============================================================================

/**
 * Base modal props
 */
export interface ModalBaseProps extends ExtendedComponentProps {
  /** Modal title */
  title: string;
  /** Show/hide modal */
  isOpen?: boolean;
  /** Close handler */
  onClose?: () => void;
  /** Hide header */
  hideHeader?: boolean;
  /** Content class name */
  contentClassName?: string;
  /** Close on overlay click */
  closeOnOverlayClick?: boolean;
  /** Close on escape key */
  closeOnEscape?: boolean;
}

/**
 * Confirmation dialog props
 */
export interface ConfirmDialogProps extends ModalBaseProps {
  /** Confirmation message */
  message: string;
  /** Confirm button text */
  confirmText?: string;
  /** Cancel button text */
  cancelText?: string;
  /** Confirm handler */
  onConfirm: () => void;
  /** Cancel handler */
  onCancel?: () => void;
  /** Dialog variant */
  variant?: "info" | "warning" | "error" | "success";
}

// =============================================================================
// NOTIFICATION AND TOAST TYPES
// =============================================================================

/**
 * Toast notification types
 */
export type ToastVariant = "info" | "success" | "warning" | "error";

/**
 * Toast notification props
 */
export interface ToastProps extends ExtendedComponentProps {
  /** Toast message */
  message: string;
  /** Toast variant */
  variant: ToastVariant;
  /** Auto dismiss duration (ms) */
  duration?: number;
  /** Dismissible by user */
  dismissible?: boolean;
  /** Dismiss handler */
  onDismiss?: () => void;
  /** Toast position */
  position?:
    | "top-left"
    | "top-right"
    | "bottom-left"
    | "bottom-right"
    | "top-center"
    | "bottom-center";
}

/**
 * Notification banner props
 */
export interface NotificationBannerProps extends ExtendedComponentProps {
  /** Notification title */
  title?: string;
  /** Notification message */
  message: string;
  /** Notification variant */
  variant: ToastVariant;
  /** Show close button */
  closable?: boolean;
  /** Close handler */
  onClose?: () => void;
}

// =============================================================================
// TABLE COMPONENT TYPES
// =============================================================================

/**
 * Table column definition
 */
export interface TableColumn<T = any> {
  /** Column key */
  key: keyof T | string;
  /** Column header */
  header: string;
  /** Column width */
  width?: string;
  /** Column alignment */
  align?: "left" | "center" | "right";
  /** Custom cell renderer */
  render?: (value: any, row: T, index: number) => ComponentChildren;
  /** Sortable column */
  sortable?: boolean;
  /** Sort key (if different from key) */
  sortKey?: string;
}

/**
 * Table props
 */
export interface TableProps<T = any> extends ExtendedComponentProps {
  /** Table data */
  data: T[];
  /** Column definitions */
  columns: TableColumn<T>[];
  /** Loading state */
  loading?: boolean;
  /** Empty state message */
  emptyMessage?: string;
  /** Row key field */
  rowKey?: keyof T | ((row: T) => string);
  /** Row click handler */
  onRowClick?: (row: T, index: number) => void;
  /** Striped rows */
  striped?: boolean;
  /** Hoverable rows */
  hoverable?: boolean;
  /** Compact table */
  compact?: boolean;
}

/**
 * Pagination props
 */
export interface PaginationProps extends ExtendedComponentProps {
  /** Current page */
  page: number;
  /** Total pages */
  totalPages: number;
  /** Page change handler */
  onPageChange?: (page: number) => void;
  /** URL prefix for pagination */
  prefix?: string;
  /** Show page info */
  showInfo?: boolean;
  /** Show first/last buttons */
  showFirstLast?: boolean;
}

// =============================================================================
// ACCESSIBILITY TYPES
// =============================================================================

/**
 * ARIA attributes interface
 */
export interface AriaAttributes {
  /** ARIA role */
  "aria-role"?: JSX.AriaRole;
  /** ARIA label */
  "aria-label"?: string;
  /** ARIA labelledby */
  "aria-labelledby"?: string;
  /** ARIA describedby */
  "aria-describedby"?: string;
  /** ARIA expanded */
  "aria-expanded"?: boolean;
  /** ARIA hidden */
  "aria-hidden"?: boolean;
  /** ARIA selected */
  "aria-selected"?: boolean;
  /** ARIA disabled */
  "aria-disabled"?: boolean;
  /** ARIA checked */
  "aria-checked"?: boolean | "mixed";
  /** ARIA pressed */
  "aria-pressed"?: boolean | "mixed";
  /** ARIA current */
  "aria-current"?: boolean | "page" | "step" | "location" | "date" | "time";
}

/**
 * Keyboard navigation props
 */
export interface KeyboardNavigationProps {
  /** Tab index */
  tabIndex?: number;
  /** Key down handler */
  onKeyDown?: JSX.KeyboardEventHandler<HTMLElement>;
  /** Key up handler */
  onKeyUp?: JSX.KeyboardEventHandler<HTMLElement>;
  /** Key press handler */
  onKeyPress?: JSX.KeyboardEventHandler<HTMLElement>;
}

/**
 * Screen reader support props
 */
export interface ScreenReaderProps {
  /** Screen reader only text */
  srOnly?: string;
  /** Live region for dynamic content */
  "aria-live"?: "off" | "polite" | "assertive";
  /** Atomic updates */
  "aria-atomic"?: boolean;
}

// =============================================================================
// RESPONSIVE DESIGN TYPES
// =============================================================================

/**
 * Responsive prop value type
 */
export type ResponsiveValue<T> = T | {
  mobileSm?: T;
  mobileMd?: T;
  mobileLg?: T;
  tablet?: T;
  desktop?: T;
};

/**
 * Responsive props interface
 */
export interface ResponsiveProps {
  /** Hide on specific breakpoints */
  hideOn?: Array<keyof Breakpoints>;
  /** Show only on specific breakpoints */
  showOn?: Array<keyof Breakpoints>;
}

// =============================================================================
// BITCOIN STAMPS UI SPECIFIC TYPES
// =============================================================================

/**
 * Stamp gallery component props (migrated from globals.d.ts)
 */
export interface StampGalleryProps extends ExtendedComponentProps {
  /** Gallery title */
  title?: string;
  /** Gallery subtitle */
  subTitle?: string;
  /** Gallery type */
  type?: string;
  /** Stamp data array */
  stamps: any[]; // TODO: Replace with StampData from stamp.d.ts
  /** Layout type */
  layout: "grid" | "row";
  /** Recent sales display */
  isRecentSales?: boolean;
  /** Filter options */
  filterBy?: string | string[];
  /** Show details */
  showDetails?: boolean;
  /** Show edition info */
  showEdition?: boolean;
  /** Grid CSS classes */
  gridClass?: string;
  /** Display counts per breakpoint */
  displayCounts?: DisplayCountBreakpoints;
  /** Pagination config */
  pagination?: PaginationProps;
  /** Show minimal details */
  showMinDetails?: boolean;
  /** Visual variant */
  variant?: "default" | "grey";
  /** View all link */
  viewAllLink?: string;
  /** Right alignment */
  alignRight?: boolean;
  /** Source page reference */
  fromPage?: string;
  /** Sort direction */
  sortBy?: "ASC" | "DESC" | undefined;
}

/**
 * Collection gallery component props (migrated from globals.d.ts)
 */
export interface CollectionGalleryProps extends ExtendedComponentProps {
  /** Gallery title */
  title?: string;
  /** Gallery subtitle */
  subTitle?: string;
  /** Collections data */
  collections: any[]; // TODO: Replace with Collection from appropriate type
  /** Grid CSS classes */
  gridClass?: string;
  /** Display counts per breakpoint */
  displayCounts?: DisplayCountBreakpoints;
  /** Pagination config */
  pagination?: PaginationProps;
}

/**
 * SRC-20 card component size variants
 */
export type SRC20CardSize = "sm" | "md" | "lg";

/**
 * SRC-20 card component props
 */
export interface SRC20CardProps extends ExtendedComponentProps {
  /** Card size variant */
  size?: SRC20CardSize;
  /** SRC-20 token data */
  tokenData: any; // TODO: Replace with SRC20Data from src20.d.ts
  /** Show minting progress */
  showMintingProgress?: boolean;
  /** Click handler */
  onClick?: () => void;
  /** Hover effects */
  hoverable?: boolean;
}

/**
 * Wallet component props
 */
export interface WalletComponentProps extends ExtendedComponentProps {
  /** Wallet address */
  address?: string;
  /** Wallet balance data */
  balanceData?: any; // TODO: Replace with WalletBalance from wallet.d.ts
  /** Connected state */
  isConnected?: boolean;
  /** Loading state */
  isLoading?: boolean;
  /** Connect handler */
  onConnect?: () => void;
  /** Disconnect handler */
  onDisconnect?: () => void;
}

// =============================================================================
// FORWARDREF AND GENERIC COMPONENT SUPPORT
// =============================================================================

/**
 * Forward ref component type
 */
export type ForwardRefComponent<T, P = {}> = (
  props: P & {
    ref?: preact.RefObject<T> | ((instance: T | null) => void) | null;
  },
) => JSX.Element | null;

/**
 * Polymorphic component base props
 */
export interface PolymorphicComponentProps<
  T extends keyof JSX.IntrinsicElements = "div",
> {
  /** Element type to render as */
  as?: T;
}

/**
 * Polymorphic component with intrinsic element props
 */
export type PolymorphicComponent<
  T extends keyof JSX.IntrinsicElements = "div",
> =
  & PolymorphicComponentProps<T>
  & Omit<ComponentProps<T>, keyof PolymorphicComponentProps<T>>;

/**
 * Generic component props with children
 */
export interface ComponentWithChildren extends ExtendedComponentProps {
  children: ComponentChildren;
}

// =============================================================================
// COMMON UI PATTERN TYPES
// =============================================================================

/**
 * Loading state props
 */
export interface LoadingStateProps {
  /** Loading state */
  isLoading?: boolean;
  /** Loading message */
  loadingMessage?: string;
  /** Loading spinner size */
  spinnerSize?: "sm" | "md" | "lg";
}

/**
 * Error state props
 */
export interface ErrorStateProps {
  /** Error state */
  hasError?: boolean;
  /** Error message */
  errorMessage?: string;
  /** Retry handler */
  onRetry?: () => void;
}

/**
 * Empty state props
 */
export interface EmptyStateProps {
  /** Empty state */
  isEmpty?: boolean;
  /** Empty message */
  emptyMessage?: string;
  /** Empty state illustration */
  emptyIllustration?: ComponentChildren;
  /** Action button for empty state */
  emptyAction?: ComponentChildren;
}

/**
 * Combined async state props
 */
export interface AsyncStateProps
  extends LoadingStateProps, ErrorStateProps, EmptyStateProps {}

// =============================================================================
// ICON COMPONENT TYPES
// =============================================================================

/**
 * Icon size variants
 */
export type IconSize = "xs" | "sm" | "md" | "lg" | "xl";

/**
 * Icon weight variants
 */
export type IconWeight = "thin" | "light" | "regular" | "bold" | "fill";

/**
 * Icon component props
 */
export interface IconProps extends ExtendedComponentProps {
  /** Icon size */
  size?: IconSize;
  /** Icon weight/style */
  weight?: IconWeight;
  /** Icon color */
  color?: string;
  /** Click handler */
  onClick?: JSX.MouseEventHandler<HTMLElement>;
}

// =============================================================================
// ANIMATION AND TRANSITION TYPES
// =============================================================================

/**
 * Animation timing functions
 */
export type AnimationTimingFunction =
  | "linear"
  | "ease"
  | "ease-in"
  | "ease-out"
  | "ease-in-out"
  | `cubic-bezier(${number}, ${number}, ${number}, ${number})`;

/**
 * Animation props
 */
export interface AnimationProps {
  /** Animation duration */
  duration?: number | string;
  /** Animation delay */
  delay?: number | string;
  /** Animation timing function */
  timingFunction?: AnimationTimingFunction;
  /** Animation iteration count */
  iterationCount?: number | "infinite";
  /** Animation direction */
  direction?: "normal" | "reverse" | "alternate" | "alternate-reverse";
  /** Animation fill mode */
  fillMode?: "none" | "forwards" | "backwards" | "both";
}

/**
 * Transition props
 */
export interface TransitionProps {
  /** Transition properties */
  property?: string | string[];
  /** Transition duration */
  duration?: number | string;
  /** Transition timing function */
  timingFunction?: AnimationTimingFunction;
  /** Transition delay */
  delay?: number | string;
}

// =============================================================================
// EXPORTS
// =============================================================================

// Re-export commonly used Preact types for convenience
export type { ComponentChildren, ComponentProps, JSX } from "preact";
