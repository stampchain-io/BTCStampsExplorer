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
import type { SRC20_TYPES } from "$types/src20.d.ts";
import type { STAMP_FILTER_TYPES, STAMP_TYPES } from "$types/stamp.d.ts";

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

// =============================================================================
// NAVIGATION CONTEXT TYPES
// =============================================================================

/**
 * Union type for both STAMP_TYPES and SRC20_TYPES
 * Used in navigation context for type filtering
 */
export type NavigatorTypes = STAMP_TYPES | SRC20_TYPES;

/**
 * Navigator Context Type
 * Provides navigation state management for stamp and SRC20 type filtering
 * Migrated from: islands/layout/NavigatorProvider.tsx
 */
export interface NavigatorContextType {
  setTypeOption: (page: string, type: NavigatorTypes, reload?: boolean) => void;
  setSortOption: (sort: string) => void;
  setFilterOption: (filter: STAMP_FILTER_TYPES) => void;
  getSort: () => string;
  getFilter: () => STAMP_FILTER_TYPES[];
  getType: () => NavigatorTypes;
  setFilter: (filters: STAMP_FILTER_TYPES[]) => void;
  setSort: (sort: string) => void;
  setType: (type: NavigatorTypes) => void;
}

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
// COMPONENT PROPS INTERFACES
// =============================================================================

// CARD COMPONENT PROPS
// =====================

/**
 * SRC-20 Card component props
 */
export interface SRC20CardProps {
  data: any[]; // TODO: Replace with SRC20Row from src20.d.ts
  fromPage: "src20" | "wallet" | "stamping/src20" | "home";
  timeframe: any; // TODO: Replace with Timeframe from appropriate domain
  onImageClick: (imgSrc: string) => void;
  currentSort?: {
    filter: string | null;
    direction: "asc" | "desc";
  };
}

/**
 * SRC-20 Card Minting component props
 */
export interface SRC20CardMintingProps {
  data: any[]; // TODO: Replace with SRC20Row from src20.d.ts
  fromPage: "src20" | "wallet" | "stamping/src20" | "home";
  timeframe: any; // TODO: Replace with Timeframe from appropriate domain
  onImageClick: (imgSrc: string) => void;
  currentSort?: {
    filter: string | null;
    direction: "asc" | "desc";
  };
}

/**
 * SRC-20 Small Card component props
 */
export interface SRC20CardSmProps {
  data: any[]; // TODO: Replace with EnrichedSRC20Row from src20.d.ts
  fromPage: "src20" | "wallet" | "stamping/src20" | "home";
  onImageClick: (imgSrc: string) => void;
}

/**
 * SRC-20 Small Card Minting component props
 */
export interface SRC20CardSmMintingProps {
  data: any[]; // TODO: Replace with EnrichedSRC20Row from src20.d.ts
  fromPage: "src20" | "wallet" | "stamping/src20" | "home";
  timeframe: any; // TODO: Replace with Timeframe from appropriate domain
  onImageClick: (imgSrc: string) => void;
}

/**
 * Recent Sale Card component props
 */
export interface RecentSaleCardProps {
  sale: any; // TODO: Replace with StampWithEnhancedSaleData from appropriate domain
  showFullDetails?: boolean;
  btcPriceUSD?: number;
}

/**
 * Wallet Stamp Card component props
 */
export interface WalletStampCardProps {
  stamp: any; // TODO: Replace with WalletStampWithValue from wallet.d.ts
  variant?: "default" | "grey";
  fromPage?: string;
}

// GALLERY COMPONENT PROPS
// ========================

/**
 * Carousel Home component props
 */
export interface CarouselHomeProps {
  carouselStamps: any[]; // TODO: Replace with StampRow from stamp.d.ts
}

/**
 * Collections Banner component props
 */
export interface CollectionsBannerProps {
  collection: any; // TODO: Replace with Collection from appropriate domain
  isDarkMode: boolean;
}

/**
 * Carousel component props
 */
export interface CarouselProps {
  stamps: any[]; // TODO: Replace with StampRow from stamp.d.ts
  automatic?: boolean;
  showNavigation?: boolean;
  class?: string;
}

/**
 * Fresh SRC-20 Gallery component props
 */
export interface FreshSRC20GalleryProps {
  /** Initial SRC-20 data from server */
  initialData: any[]; // TODO: Replace with EnrichedSRC20Row from src20.d.ts
  /** Initial pagination state */
  initialPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  /** Wallet address for API calls */
  address: string;
  /** Initial sort value - maintaining existing ASC/DESC functionality */
  initialSort: "ASC" | "DESC";
  /** Page identifier for conditional rendering */
  fromPage?: string;
  /** Show loading skeleton during transitions */
  showLoadingSkeleton?: boolean;
  /** Enable Fresh.js partial navigation */
  enablePartialNavigation?: boolean;
}

/**
 * Fresh Stamp Gallery component props
 */
export interface FreshStampGalleryProps {
  /** Initial stamp data from server */
  initialData: any[]; // TODO: Replace with StampRow from stamp.d.ts
  /** Initial pagination state */
  initialPagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
  /** Wallet address for API calls */
  address: string;
  /** Initial sort value - maintaining existing ASC/DESC functionality */
  initialSort: "ASC" | "DESC";
  /** Page identifier for conditional rendering */
  fromPage?: string;
  /** Enable/disable Fresh.js partial navigation */
  enablePartialNavigation?: boolean;
  /** Show loading skeleton during transitions */
  showLoadingSkeleton?: boolean;
  /** Grid class for styling */
  gridClass?: string;
}

/**
 * Recent Sales Gallery component props
 */
export interface RecentSalesGalleryProps {
  title?: string;
  subTitle?: string;
  sales?: any[]; // TODO: Replace with StampWithEnhancedSaleData from appropriate domain
  layout?: "grid" | "list";
  showFullDetails?: boolean;
  displayCounts?: {
    mobileSm?: number;
    mobileMd?: number;
    mobileLg?: number;
    tablet?: number;
    desktop?: number;
  };
  pagination?: {
    page: number;
    totalPages: number;
    prefix?: string;
    onPageChange?: (page: number) => void;
  };
  isLoading?: boolean;
  btcPriceUSD?: number;
  autoRefresh?: boolean;
  refreshIntervalMs?: number;
  onRefresh?: () => Promise<void>;
  gridClass?: string;
  maxItems?: number;
}

/**
 * SRC-20 Gallery component props
 */
export interface SRC20GalleryProps {
  title?: string;
  subTitle?: string;
  viewType: "minted" | "minting";
  fromPage: "src20" | "wallet" | "stamping/src20" | "home";
  initialData?: any[]; // TODO: Replace with EnrichedSRC20Row from src20.d.ts
  pagination?: {
    page: number;
    totalPages: number;
    prefix?: string;
    limit?: number;
    onPageChange?: (page: number) => void;
  };
  timeframe: "24H" | "7D" | "30D";
  serverData?: {
    data: any[]; // TODO: Replace with EnrichedSRC20Row from src20.d.ts
    total: number;
    page: number;
    totalPages: number;
  };
  currentSort?: {
    filter: string | null;
    direction: "asc" | "desc";
  };
}

/**
 * Stamp Overview Gallery component props
 */
export interface StampOverviewGalleryProps {
  stamps_art?: any[]; // TODO: Replace with StampRow from stamp.d.ts
  stamps_posh?: any[]; // TODO: Replace with StampRow from stamp.d.ts
  stamps_src721?: any[]; // TODO: Replace with StampRow from stamp.d.ts
  collectionData?: any[]; // TODO: Replace with Collection from appropriate domain
}

// TABLE COMPONENT PROPS
// =====================

/**
 * SRC-20 Minting Table component props
 */
export interface SRC20MintingTableProps {
  data: any[]; // TODO: Replace with SRC20Row from src20.d.ts
  fromPage: "src20" | "wallet" | "stamping/src20" | "home";
  timeframe: any; // TODO: Replace with Timeframe from appropriate domain
  onImageClick: (imgSrc: string) => void;
}

/**
 * SRC-20 Minted Table component props
 */
export interface SRC20MintedTableProps {
  data: any[]; // TODO: Replace with SRC20Row from src20.d.ts
  fromPage: "src20" | "wallet" | "stamping/src20" | "home";
  timeframe: any; // TODO: Replace with Timeframe from appropriate domain
  onImageClick: (imgSrc: string) => void;
}

/**
 * SRC-20 Mints component props
 */
export interface SRC20MintsProps {
  mints: any[]; // TODO: Replace with SRC20Row from src20.d.ts
}

/**
 * SRC-20 Transfers component props
 */
export interface SRC20TransfersProps {
  sends: any[]; // TODO: Replace with SRC20Row from src20.d.ts
}

/**
 * Stamp Sales component props
 */
export interface StampSalesProps {
  initialData?: any[]; // TODO: Replace with StampWithEnhancedSaleData from appropriate domain
  title?: string;
  subTitle?: string;
  variant?: "home" | "detail";
  displayCounts?: DisplayCountBreakpoints;
  gridClass?: string;
}

/**
 * Stamp Transfers component props
 */
export interface StampTransfersProps {
  transfers: any[]; // TODO: Replace with StampRow from stamp.d.ts
}

/**
 * Stamp Listings Open component props
 */
export interface StampListingsOpenProps {
  listings: any[]; // TODO: Replace with appropriate type
}

/**
 * Stamp Listings All component props
 */
export interface StampListingsAllProps {
  listings: any[]; // TODO: Replace with appropriate type
}

/**
 * Holders Table component props
 */
export interface HoldersTableProps {
  holders?: any[]; // TODO: Replace with Holder from appropriate domain
}

/**
 * Holders Table Base component props
 */
export interface HoldersTableBaseProps {
  holders?: any[]; // TODO: Replace with Holder from appropriate domain
}

/**
 * Pie Chart component props
 */
export interface PieChartProps {
  holders: Array<{
    address: string | null;
    amt: number | string;
    percentage: number | string;
  }>;
}

// CONTENT COMPONENT PROPS
// ========================

/**
 * Explorer Content component props
 */
export interface ExplorerContentProps {
  stamps: any[]; // TODO: Replace with StampRow from stamp.d.ts
  isRecentSales?: boolean;
  fromPage?: string;
  pagination?: {
    page: number;
    totalPages: number;
    prefix?: string;
    onPageChange?: (page: number) => void;
  };
}

/**
 * Stamp Overview Content component props
 */
export interface StampOverviewContentProps {
  stamps: any[]; // TODO: Replace with StampRow from stamp.d.ts
  isRecentSales?: boolean;
  fromPage?: string;
  pagination?: {
    page: number;
    totalPages: number;
    prefix?: string;
    onPageChange?: (page: number) => void;
  };
}

/**
 * SRC-20 Overview Content component props
 */
export interface SRC20OverviewContentProps {
  mintingData?: any;
  timeframe: "24H" | "7D" | "30D";
  sortBy: any; // TODO: Replace with SortOption from appropriate domain
  sortDirection: "asc" | "desc";
  viewType: "minted" | "minting";
  btcPrice?: number;
  btcPriceSource?: string;
}

/**
 * Wallet Dashboard Details component props
 */
export interface WalletDashboardDetailsProps {
  walletData: any; // TODO: Replace with WalletOverviewInfo from wallet.d.ts
  stampsTotal: number;
  src20Total: number;
  stampsCreated: number;
  setShowItem: (type: string) => void;
}

/**
 * Wallet Dispenser Details component props
 */
export interface WalletDispenserDetailsProps {
  walletData: any; // TODO: Replace with WalletOverviewInfo from wallet.d.ts
  stampsTotal: number;
  src20Total: number;
  stampsCreated: number;
  setShowItem: (type: string) => void;
}

/**
 * Wallet Profile Details component props
 */
export interface WalletProfileDetailsProps {
  walletData: any; // TODO: Replace with WalletOverviewInfo from wallet.d.ts
  stampsTotal: number;
  src20Total: number;
  stampsCreated: number;
  setShowItem: (type: string) => void;
}

/**
 * Section Header component props
 */
export interface SectionHeaderProps {
  title: string;
  config: any; // TODO: Replace with SectionSortingConfig from appropriate domain
  sortBy: string;
  onSortChange: (sort: string) => void;
  enableAdvancedSorting?: boolean;
  showMetrics?: boolean;
}

/**
 * Stamp Info component props
 */
export interface StampInfoProps {
  stamp: any; // TODO: Replace with StampRow from stamp.d.ts
  lowestPriceDispenser: any;
}

/**
 * Block component props
 */
export interface BlockProps {
  block: any; // TODO: Replace with BlockRow from appropriate domain
  selected: any; // TODO: Replace with Signal<BlockRow> from appropriate domain
}

/**
 * FAQ Accordion component props
 */
export interface FaqAccordionProps {
  item: any; // TODO: Replace with FAQ_CONTENT item type from appropriate domain
}

// FORM COMPONENT PROPS
// ====================

/**
 * Input Field component props (extends base InputProps)
 */
export interface InputFieldProps extends InputProps {
  type: string;
  onInput?: (e: JSX.TargetedEvent<HTMLInputElement, Event>) => void;
  inputMode?: "text" | "numeric";
  maxLength?: number;
  minLength?: number;
  min?: string;
  step?: string;
  textAlign?: "left" | "center" | "right";
  isUppercase?: boolean;
}

/**
 * SRC-20 Input Field component props
 */
export interface SRC20InputFieldProps {
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: Event) => void;
  onBlur?: () => void;
  error?: string;
  maxLength?: number;
  isUppercase?: boolean;
  inputMode?: "numeric" | "text" | "email";
  pattern?: string;
  onFocus?: () => void;
}

/**
 * Select Field component props (extends base SelectProps)
 */
export interface SelectFieldProps extends SelectProps {
  onClick?: (e: JSX.TargetedEvent<HTMLSelectElement, Event>) => void;
  options: any[]; // TODO: Replace with StampRow from stamp.d.ts
  className?: string;
}

// MODAL COMPONENT PROPS
// =====================

/**
 * Generic modal Props interface (used by multiple modals)
 */
export interface ModalComponentProps {
  img: string;
  name: string;
  owner: string;
}

/**
 * Buy Stamp Modal component props
 */
export interface BuyStampModalProps extends ModalComponentProps {}

/**
 * Donate Stamp Modal component props
 */
export interface DonateStampModalProps extends ModalComponentProps {}

/**
 * Filter SRC-20 Modal component props
 */
export interface FilterSRC20ModalProps extends ModalComponentProps {}

/**
 * Receive Address Modal component props
 */
export interface ReceiveAddyModalProps extends ModalComponentProps {}

/**
 * Send BTC Modal component props
 */
export interface SendBTCModalProps extends ModalComponentProps {}

/**
 * Detail SRC-101 Modal component props
 */
export interface DetailSRC101ModalProps extends ModalComponentProps {}

/**
 * Connect Wallet Modal component props
 */
export interface ConnectWalletModalProps {
  connectors: ComponentChildren;
  handleClose: () => void;
}

/**
 * Preview Code Modal component props
 */
export interface PreviewCodeModalProps {
  src: string;
}

/**
 * Preview Image Modal component props
 */
export interface PreviewImageModalProps {
  src: string | File;
  contentType?: "html" | "text" | "image" | "audio";
}

/**
 * Image Modal component props
 */
export interface ImageModalProps {
  imgSrc: string;
  isOpen: boolean;
  onClose: () => void;
}

// LAYOUT COMPONENT PROPS
// =======================

/**
 * Chart Widget component props
 */
export interface ChartWidgetProps {
  data: any; // TODO: Replace with ChartData from appropriate domain
  fromPage: string;
  tick: string;
}

/**
 * Modal Overlay component props
 */
export interface ModalOverlayProps {
  handleClose: () => void;
  children: ComponentChildren;
  animation?: any; // TODO: Replace with ModalAnimation from appropriate domain
}

/**
 * Wallet Provider component props
 */
export interface WalletProviderProps {
  providerKey: any; // TODO: Replace with WalletProviderKey from wallet.d.ts
  onSuccess?: () => void;
}

/**
 * Meta Tags component props
 */
export interface MetaTagsProps {
  title?: string;
  description?: string;
  image?: string;
  skipImage?: boolean;
  skipTitle?: boolean;
  skipDescription?: boolean;
  skipOgMeta?: boolean;
}

/**
 * Scroll Container component props
 */
export interface ScrollContainerProps {
  children: ComponentChildren;
  class?: string;
  onScroll?: (e: Event) => void;
}

/**
 * Modal Search Base component props
 */
export interface ModalSearchBaseProps {
  children: ComponentChildren;
  onClose?: () => void;
}

// DISPLAY COMPONENT PROPS
// ========================

/**
 * BTC Value Display component props
 */
export interface BTCValueDisplayProps {
  value: number;
  showUSD?: boolean;
  btcPriceUSD?: number;
  className?: string;
}

/**
 * Stamp BTC Value component props
 */
export interface StampBTCValueProps {
  value: number;
  showUSD?: boolean;
  btcPriceUSD?: number;
  className?: string;
}

/**
 * Wallet Stamp Value component props
 */
export interface WalletStampValueProps {
  value: number;
  showUSD?: boolean;
  btcPriceUSD?: number;
  className?: string;
}

/**
 * Total BTC Value component props
 */
export interface TotalBTCValueProps {
  value: number;
  showUSD?: boolean;
  btcPriceUSD?: number;
  className?: string;
}

/**
 * BTC Value Summary component props
 */
export interface BTCValueSummaryProps {
  value: number;
  showUSD?: boolean;
  btcPriceUSD?: number;
  className?: string;
}

/**
 * Market Data Status component props
 */
export interface MarketDataStatusProps {
  status: string;
  lastUpdated?: Date;
  className?: string;
}

// INDICATOR COMPONENT PROPS
// ==========================

/**
 * Mara Mode Indicator component props
 */
export interface MaraModeIndicatorProps {
  outputValue: number;
  feeRate?: number | null;
  class?: string;
}

/**
 * Transaction Status component props
 */
export interface TransactionStatusProps {
  state: any; // TODO: Replace with TransactionState from transaction.d.ts
  txid?: string;
  confirmations?: number;
  targetConfirmations?: number;
  estimatedTime?: number;
  errorMessage?: string;
  class?: string;
  onViewTransaction?: () => void;
  onRetry?: () => void;
}

/**
 * Transaction Badge component props
 */
export interface TransactionBadgeProps {
  state: any; // TODO: Replace with TransactionState from transaction.d.ts
  class?: string;
}

/**
 * Mara Success Message component props
 */
export interface MaraSuccessMessageProps {
  txid: string;
  outputValue: number;
  feeRate: number;
  poolInfo?: {
    name: string;
    hashrate?: string;
  };
  class?: string;
}

/**
 * Progress Indicator component props
 */
export interface ProgressIndicatorProps {
  state: any; // TODO: Replace with ProgressState from appropriate domain
  message?: string;
  class?: string;
}

/**
 * Transaction Progress component props
 */
export interface TransactionProgressProps {
  steps: any[]; // TODO: Replace with TransactionStep from transaction.d.ts
  class?: string;
}

/**
 * Spinner component props
 */
export interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: string;
  class?: string;
}

/**
 * Progressive Estimation Indicator component props
 */
export interface ProgressiveEstimationIndicatorProps {
  /** Whether the component is currently connected to a wallet */
  isConnected: boolean;
  /** Whether a transaction is being submitted */
  isSubmitting: boolean;
  /** Whether pre-fetching UTXO data is in progress */
  isPreFetching: boolean;
  /** Current estimation phase: "instant" | "smart" | "exact" */
  currentPhase: "instant" | "smart" | "exact";
  /** Phase completion flags */
  phase1: boolean;
  phase2: boolean;
  phase3: boolean;
  /** Error message if estimation failed */
  feeEstimationError: string | null;
  /** Function to clear the error */
  clearError: () => void;
}

// BUTTON COMPONENT PROPS
// =======================

/**
 * Selector Buttons component props
 */
export interface SelectorButtonsProps {
  options: any[]; // TODO: Replace with SelectorOption from appropriate domain
  value?: string;
  defaultValue?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
  size: "xs" | "sm" | "md" | "lg";
  color: "grey" | "purple";
  className?: string;
}

/**
 * Sort Button component props
 */
export interface SortProps {
  searchParams?: URLSearchParams | undefined;
  initSort?: "ASC" | "DESC" | undefined;
  sortParam?: string;
  onChangeSort?: (newSort: "ASC" | "DESC") => void;
}

/**
 * Read All Button component props
 */
export interface ReadAllButtonProps {
  href?: string;
}

/**
 * Toggle Switch Button component props
 */
export interface ToggleSwitchButtonProps {
  isActive: boolean;
  onToggle: () => void;
  toggleButtonId: string;
  className?: string;
  onMouseEnter?: (e: MouseEvent) => void;
  onMouseLeave?: (e: MouseEvent) => void;
  onClick?: (e: MouseEvent) => void;
  buttonRef?: preact.RefObject<HTMLButtonElement>;
}

// ICON COMPONENT PROPS
// ====================

/**
 * Loading Icon component props
 */
export interface LoadingIconProps {
  size?: IconSize;
  className?: string;
}

/**
 * Gear Icon component props
 */
export interface GearIconProps {
  size?: IconSize;
  className?: string;
  onClick?: () => void;
}

/**
 * Close Icon component props
 */
export interface CloseIconProps {
  size?: IconSize;
  className?: string;
  onClick?: () => void;
}

// TOOL COMPONENT PROPS
// ====================

/**
 * SRC-20 Mint Tool component props
 */
export interface SRC20MintToolProps {
  trxType?: "olga" | "multisig";
  tick?: string | undefined | null;
  mintStatus?: any | null | undefined;
  holders?: number;
}

/**
 * Mint Progress component props
 */
export interface MintProgressProps {
  progress: string;
  progressWidth: string;
  maxSupply: string;
  limit: string;
  minters: string;
}

/**
 * SRC-101 Register Tool component props
 */
export interface SRC101RegisterToolProps {
  trxType?: "olga" | "multisig";
}

/**
 * Fairmint Tool component props
 */
export interface FairmintToolProps {
  fairminters: any[];
}

/**
 * Status Messages component props
 */
export interface StatusMessagesProps {
  submissionMessage?:
    | {
      message: string;
      txid?: string;
    }
    | string
    | null;
  apiError?: string | null;
  fileUploadError?: string | null;
  walletError?: string | null;
  maraError?: string | null;
  transactionHex?: string | null;
  onCopyHex?: () => void;
}

// BADGE COMPONENT PROPS
// =====================

/**
 * Activity Badge component props
 */
export interface ActivityBadgeProps {
  level: any; // TODO: Replace with ActivityLevelType from appropriate domain
  showLabel?: boolean;
  size?: "xs" | "sm" | "md" | "lg";
  className?: string;
}

// HEADER COMPONENT PROPS
// =======================

/**
 * SRC-20 Overview Header component props
 */
export interface SRC20OverviewHeaderProps {
  onViewTypeChange?: (viewType: string) => void;
  viewType: "minted" | "minting";
  onTimeframeChange?: (timeframe: "24H" | "7D" | "30D") => void;
  onFilterChange?: (filter: string, direction?: "asc" | "desc") => void;
  currentSort?: {
    filter: string | null;
    direction: "asc" | "desc";
  };
}

// FEED COMPONENT PROPS
// ====================

/**
 * Sales Activity Feed component props
 */
export interface SalesActivityFeedProps {
  title?: string;
  subTitle?: string;
  sales?: any[]; // TODO: Replace with StampWithEnhancedSaleData from appropriate domain
  isLoading?: boolean;
  btcPriceUSD?: number;
  maxItems?: number;
  showTimestamps?: boolean;
  showStampPreviews?: boolean;
  autoRefresh?: boolean;
  refreshIntervalMs?: number;
  onRefresh?: () => Promise<void>;
  onItemClick?: (sale: any) => void; // TODO: Replace with StampWithEnhancedSaleData
  compact?: boolean;
}

// FILTER COMPONENT PROPS
// =======================

/**
 * Range Input component props
 */
export interface RangeInputProps {
  label: string;
  placeholder: string;
  value: string;
  onChange: (value: string) => void;
  type: "stamp" | "price";
}

/**
 * Checkbox component props
 */
export interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: () => void;
  hasDropdown?: boolean;
  dropdownContent?: ComponentChildren;
}

/**
 * Radio component props
 */
export interface RadioProps {
  label: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  name: string;
}

// SORTING COMPONENT PROPS
// ========================

/**
 * Sorting Provider component props
 */
export interface SortingProviderProps {
  /** Child components */
  children: ComponentChildren;
  /** Sorting configuration */
  config: any; // TODO: Replace with UseSortingConfig from appropriate domain
  /** Optional initial sort state */
  initialState?: any; // TODO: Replace with Partial<SortState> from appropriate domain
  /** Optional test ID for testing */
  testId?: string;
}

/**
 * Enhanced Sort Button component props
 */
export interface EnhancedSortButtonProps {
  enableAdvancedSorting?: boolean;
  showMetrics?: boolean;
  className?: string;
}

/**
 * Sorting Component props
 */
export interface SortingComponentProps {
  /** Child components */
  children: ComponentChildren;
  /** Additional CSS classes */
  className?: string;
  /** Test ID for testing */
  testId?: string;
  /** Accessibility label */
  "aria-label"?: string;
}

/**
 * Sorting Dropdown component props
 */
export interface SortingDropdownProps {
  /** Available sort options */
  options: ReadonlyArray<any>; // TODO: Replace with SortOption from appropriate domain
  /** Additional CSS classes */
  className?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Test ID for testing */
  testId?: string;
  /** Whether to show loading state */
  showLoading?: boolean;
  /** Custom option renderer */
  renderOption?: (option: any) => ComponentChildren; // TODO: Replace with SortOption
}

/**
 * Sorting Buttons component props
 */
export interface SortingButtonsProps {
  /** Available sort options */
  options: ReadonlyArray<any>; // TODO: Replace with SortOption from appropriate domain
  /** Additional CSS classes */
  className?: string;
  /** Test ID for testing */
  testId?: string;
  /** Button variant */
  variant?: "primary" | "secondary" | "ghost";
  /** Button size */
  size?: "sm" | "md" | "lg";
  /** Whether to show icons */
  showIcons?: boolean;
  /** Whether to show loading state */
  showLoading?: boolean;
  /** Custom button renderer */
  renderButton?: (
    option: any, // TODO: Replace with SortOption
    isActive: boolean,
  ) => ComponentChildren;
}

/**
 * Sorting Label component props
 */
export interface SortingLabelProps {
  /** Additional CSS classes */
  className?: string;
  /** Test ID for testing */
  testId?: string;
  /** Whether to show direction indicator */
  showDirection?: boolean;
  /** Whether to show loading state */
  showLoading?: boolean;
  /** Custom label format */
  format?: (sortBy: any, direction: string) => string; // TODO: Replace with SortKey
}

/**
 * Sorting Error component props
 */
export interface SortingErrorProps {
  /** Additional CSS classes */
  className?: string;
  /** Test ID for testing */
  testId?: string;
  /** Custom error message */
  message?: string;
  /** Whether to show retry button */
  showRetry?: boolean;
  /** Custom retry handler */
  onRetry?: () => void;
}

/**
 * Sorting Provider with URL component props
 */
export interface SortingProviderWithURLProps {
  /** Child components */
  children: ComponentChildren;
  /** Sorting configuration with URL sync */
  config: any; // TODO: Replace with SortingProviderWithURLConfig from appropriate domain
  /** Optional initial sort state */
  initialState?: any; // TODO: Replace with Partial<SortState<SortKey>> from appropriate domain
  /** Optional test ID for testing */
  testId?: string;
}

/**
 * Convenience Provider component props
 */
export interface ConvenienceProviderProps {
  /** Child components */
  children: ComponentChildren;
  /** Default sort value */
  defaultSort?: any; // TODO: Replace with SortKey from appropriate domain
  /** Optional test ID */
  testId?: string;
}

/**
 * Styled Sorting Dropdown component props
 */
export interface StyledSortingDropdownProps {
  /** Available sort options */
  options: ReadonlyArray<any>; // TODO: Replace with SortOption from appropriate domain
  /** Additional CSS classes */
  className?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Test ID for testing */
  testId?: string;
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Whether to show loading state */
  showLoading?: boolean;
}

/**
 * Styled Sorting Buttons component props
 */
export interface StyledSortingButtonsProps {
  /** Available sort options */
  options: ReadonlyArray<any>; // TODO: Replace with SortOption from appropriate domain
  /** Additional CSS classes */
  className?: string;
  /** Test ID for testing */
  testId?: string;
  /** Button variant */
  variant?: "primary" | "secondary" | "ghost";
  /** Button size */
  size?: "sm" | "md" | "lg";
  /** Whether to show icons */
  showIcons?: boolean;
  /** Whether to show loading state */
  showLoading?: boolean;
}

/**
 * Styled Sorting Label component props
 */
export interface StyledSortingLabelProps {
  /** Additional CSS classes */
  className?: string;
  /** Test ID for testing */
  testId?: string;
  /** Label style variant */
  variant?: "default" | "compact" | "detailed";
  /** Whether to show direction indicator */
  showDirection?: boolean;
  /** Whether to show loading state */
  showLoading?: boolean;
}

/**
 * Styled Sorting Error component props
 */
export interface StyledSortingErrorProps {
  /** Additional CSS classes */
  className?: string;
  /** Test ID for testing */
  testId?: string;
  /** Custom error message */
  message?: string;
  /** Whether to show retry button */
  showRetry?: boolean;
  /** Custom retry handler */
  onRetry?: () => void;
}

/**
 * Complete Sorting Interface component props
 */
export interface CompleteSortingInterfaceProps {
  /** Sorting configuration */
  config: any; // TODO: Replace with UseSortingConfig from appropriate domain
  /** Available sort options */
  options: ReadonlyArray<any>; // TODO: Replace with SortOption from appropriate domain
  /** UI variant */
  variant?: "dropdown" | "buttons" | "hybrid";
  /** Size variant */
  size?: "sm" | "md" | "lg";
  /** Additional CSS classes */
  className?: string;
  /** Test ID for testing */
  testId?: string;
  /** Whether to show current sort label */
  showLabel?: boolean;
  /** Whether to show error messages */
  showError?: boolean;
}

/**
 * Sorting Error Boundary component props
 */
export interface SortingErrorBoundaryProps {
  children: ComponentChildren;
  fallback?: ComponentChildren;
  onError?: (error: any, errorDetails?: string) => void; // TODO: Replace with ErrorInfo
  maxRetries?: number;
  retryDelay?: number;
  context?: "wallet" | "stamp" | "src20" | "general";
  className?: string;
  testId?: string;
}

/**
 * Sorting Error Fallback component props
 */
export interface SortingErrorFallbackProps {
  error: any; // TODO: Replace with ErrorInfo from appropriate domain
  onRetry: () => void;
  onReset: () => void;
  context: string;
  retryCount: number;
  maxRetries: number;
}

// TOAST COMPONENT PROPS
// ======================

/**
 * Toast Provider component props
 */
export interface ToastProviderProps {
  children: ComponentChildren;
}

/**
 * Toast Component props
 */
export interface ToastComponentProps {
  id: string;
  message: string;
  type: any; // TODO: Replace with ToastTypeFromProvider["type"] from appropriate domain
  onClose: () => void;
}

// ERROR COMPONENT PROPS
// =====================

/**
 * Error Display component props
 */
export interface ErrorDisplayProps {
  error: any; // TODO: Replace with ErrorInfo from errors.d.ts
  onRetry?: () => void;
  onDismiss?: () => void;
  compact?: boolean;
  showDetails?: boolean;
  className?: string;
}

// OTHER COMPONENT PROPS
// =====================

/**
 * Setting component props
 */
export interface SettingProps {
  initFilter: string[];
  open: boolean;
  handleOpen: (open: boolean) => void;
  filterButtons: string[];
  onFilterClick?: (filter: string) => void;
}

/**
 * Transaction Hex Display component props
 */
export interface TransactionHexDisplayProps {
  hex: string;
  className?: string;
}

/**
 * Mara Status Link component props
 */
export interface MaraStatusLinkProps {
  href: string;
  className?: string;
}

/**
 * Stat Base component props
 */
export interface StatBaseProps {
  label: string | ComponentChildren;
  value: string | ComponentChildren;
  align?: any; // TODO: Replace with AlignmentType from appropriate domain
}

/**
 * Author component props
 */
export interface AuthorProps {
  name: string;
  twitter: string;
  website?: string;
}

/**
 * Article component props
 */
export interface ArticleProps {
  title: string;
  subtitle: string;
  headerImage: string;
  children: ComponentChildren;
  importantNotes?: string[];
}

/**
 * Shared List component props
 */
export interface SharedListProps {
  children: ComponentChildren;
  hasImportantNotes?: boolean;
}

/**
 * Mara Service Unavailable Modal component props
 */
export interface MaraServiceUnavailableModalProps {
  onSwitchToStandard: () => void;
  onRetry: () => void;
  onClose: () => void;
}

/**
 * Mara Mode Warning Modal component props
 */
export interface MaraModeWarningModalProps {
  outputValue: number;
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Stat Title component props
 */
export interface StatTitleProps {
  label: string;
  value: string | ComponentChildren;
  align?: "left" | "center" | "right";
}

/**
 * Stat Item component props
 */
export interface StatItemProps {
  label: string;
  value: string | ComponentChildren;
  align?: "left" | "center" | "right";
  class?: string;
}

// PAGE COMPONENT PROPS
// ====================

/**
 * SRC-20 Detail Page component props
 */
export interface SRC20DetailPageProps {
  tick: string;
  data: any; // TODO: Replace with appropriate SRC-20 detail data type
}

/**
 * Tool Stamp Page component props
 */
export interface ToolStampPageProps {
  action: string;
}

/**
 * Stamp Detail Page component props
 */
export interface StampDetailPageProps {
  id: string;
  stamp: any; // TODO: Replace with StampRow from stamp.d.ts
}

/**
 * Tool Fairmint Page component props
 */
export interface ToolFairmintPageProps {
  fairminters: any[];
}

/**
 * Collection Overview Page component props
 */
export interface CollectionOverviewPageProps {
  overview: string;
  collection: any; // TODO: Replace with Collection from appropriate domain
}

/**
 * Tools SRC-101 Page component props
 */
export interface ToolsSrc101PageProps {
  action: string;
}

/**
 * Color Swatch component props
 */
export interface ColorSwatchProps {
  color: string;
  name: string;
}

/**
 * Tool SRC-20 Page component props
 */
export interface ToolSrc20PageProps {
  action: string;
  tick?: string;
}

// =============================================================================
// EXPORTS
// =============================================================================

// Re-export commonly used Preact types for convenience
export type { ComponentChildren, ComponentProps, JSX } from "preact";
