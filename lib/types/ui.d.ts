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

import type { ButtonProps } from "$button";
import type { Timeframe } from "$components/layout/types.ts";
import type { SRC20Transaction, StampTransaction } from "$types/stamping.ts";
import type { FeeDetails } from "$types/base.d.ts";

import type { SRC20_TYPES, SRC20Row } from "$types/src20.d.ts";
import type {
  STAMP_FILTER_TYPES,
  STAMP_TYPES,
  StampRow,
} from "$types/stamp.d.ts";
import type * as preact from "preact";
import type { ComponentChildren, ComponentProps, JSX } from "preact";

// Re-export imported types that are used by other modules
export type { ButtonProps };
// Removed circular self-import block - these types should be defined locally
// import type {
//   ActivityBadgeProps,
//   AnchorElementProps,
//   AnimationProps,
//   ArticleProps,
//   AsyncStateProps,
//   AuthorProps,
//   BaseButtonProps,
//   BaseComponentProps,
//   BlockProps,
//   BTCValueDisplayProps,
//   BTCValueSummaryProps,
//   ButtonElementProps,
//   BuyStampModalProps,
//   CarouselHomeProps,
//   CarouselProps,
//   ChartWidgetProps,
//   CheckboxProps,
//   CloseIconProps,
//   CollectionGalleryProps,
//   CollectionOverviewPageProps,
//   CollectionsBannerProps,
//   ColorSwatchProps,
//   CompleteSortingInterfaceProps,
//   ConfirmDialogProps,
//   ConnectWalletModalProps,
//   ContainerProps,
//   ConvenienceProviderProps,
//   DetailSRC101ModalProps,
//   DonateStampModalProps,
//   EmptyStateProps,
//   EnhancedSortButtonProps,
//   ErrorDisplayProps,
//   ErrorStateProps,
//   ExplorerContentProps,
//   ExtendedComponentProps,
//   FairmintToolProps,
//   FaqAccordionProps,
//   FilterSRC20ModalProps,
//   FlexboxProps,
//   FormControlProps,
//   FreshSRC20GalleryProps,
//   FreshStampGalleryProps,
//   GearIconProps,
//   GridProps,
//   HoldersTableBaseProps,
//   HoldersTableProps,
//   IconButtonProps,
//   IconProps,
//   InputFieldProps,
//   InputProps,
//   KeyboardNavigationProps,
//   LoadingIconProps,
//   LoadingStateProps,
//   MaraModeIndicatorProps,
//   MaraModeWarningModalProps,
//   MaraServiceUnavailableModalProps,
//   MaraStatusLinkProps,
//   MaraSuccessMessageProps,
//   MarketDataStatusProps,
//   MetaTagsProps,
//   MintProgressProps,
//   ModalBaseProps,
//   ModalComponentProps,
//   ModalOverlayProps,
//   ModalSearchBaseProps,
//   NotificationBannerProps,
//   PaginationProps,
//   PieChartProps,
//   PolymorphicComponentProps,
//   PreviewCodeModalProps,
//   PreviewImageModalProps,
//   ProcessingButtonProps,
//   ProgressIndicatorProps,
//   ProgressiveEstimationIndicatorProps,
//   RadioProps,
//   RangeInputProps,
//   ReadAllButtonProps,
//   ReceiveAddyModalProps,
//   RecentSaleCardProps,
//   RecentSalesGalleryProps,
//   ResponsiveProps,
//   SalesActivityFeedProps,
//   ScreenReaderProps,
//   ScrollContainerProps,
//   SectionHeaderProps,
//   SelectFieldProps,
//   SelectorButtonsProps,
//   SelectProps,
//   SendBTCModalProps,
//   SettingProps,
//   SharedListProps,
//   SortingButtonsProps,
//   SortingComponentProps,
//   SortingDropdownProps,
//   SortingErrorBoundaryProps,
//   SortingErrorFallbackProps,
//   SortingErrorProps,
//   SortingLabelProps,
//   SortingProviderProps,
//   SortingProviderWithURLProps,
//   SortProps,
//   SpinnerProps,
//   SRC101RegisterToolProps,
//   SRC20CardMintingProps,
//   SRC20CardProps,
//   SRC20CardSmMintingProps,
//   SRC20CardSmProps,
//   SRC20DetailPageProps,
//   SRC20InputFieldProps,
//   SRC20MintedTableProps,
//   SRC20MintingTableProps,
//   SRC20MintsProps,
//   SRC20MintToolProps,
//   SRC20OverviewContentProps,
//   SRC20OverviewHeaderProps,
//   SRC20TransfersProps,
//   StampBTCValueProps,
//   StampDetailPageProps,
//   StampGalleryProps,
//   StampInfoProps,
//   StampListingsAllProps,
//   StampListingsOpenProps,
//   StampOverviewContentProps,
//   StampOverviewGalleryProps,
//   StampSalesProps,
//   StampTransfersProps,
//   StatBaseProps,
//   StatItemProps,
//   StatTitleProps,
//   StatusMessagesProps,
//   StyledSortingButtonsProps,
//   StyledSortingDropdownProps,
//   StyledSortingErrorProps,
//   StyledSortingLabelProps,
//   TableProps,
//   TextareaProps,
//   ToastComponentProps,
//   ToastProps,
//   ToastProviderProps,
//   ToggleSwitchButtonProps,
//   ToolFairmintPageProps,
//   ToolSrc20PageProps,
//   ToolsSrc101PageProps,
//   ToolStampPageProps,
//   TotalBTCValueProps,
//   TransactionBadgeProps,
//   TransactionHexDisplayProps,
//   TransactionProgressProps,
//   TransactionStatusProps,
//   TransitionProps,
//   WalletComponentProps,
//   WalletDashboardDetailsProps,
//   WalletDispenserDetailsProps,
//   WalletProfileDetailsProps,
//   WalletProviderProps,
//   WalletStampCardProps,
//   WalletStampValueProps,
// } from "$types/ui.d.ts"; // Commented out circular import

// =============================================================================
// CORE UI FRAMEWORK TYPES
// =============================================================================

/**
 * Base component props that all UI components should extend
 */

/**
 * Extended base props with common HTML attributes
 */

// =============================================================================
// BASIC COMPONENT PROP TYPES
// =============================================================================

/**
 * Basic HTML element prop types
 */
export interface AnchorElementProps extends JSX.HTMLAttributes<HTMLAnchorElement> {
  href?: string;
  target?: string;
  rel?: string;
}

export interface BaseButtonProps extends JSX.HTMLAttributes<HTMLButtonElement> {
  type?: "button" | "submit" | "reset";
}

export interface ButtonElementProps extends JSX.HTMLAttributes<HTMLButtonElement> {
  variant?: string;
  color?: string;
  size?: string;
}

/**
 * Basic component prop interfaces
 */
export interface BTCValueDisplayProps {
  value: number;
  className?: string;
  precision?: number;
}

export interface BTCValueSummaryProps {
  values: number[];
  className?: string;
  showTotal?: boolean;
}

export interface StatItemProps {
  label: string;
  value: string;
  align?: "left" | "center" | "right";
  class?: string;
  href?: string;
  target?: "_self" | "_blank";
}

export interface StatTitleProps {
  label: string;
  value: string;
  align?: "left" | "center" | "right";
  href?: string;
  target?: "_self" | "_blank";
}

export interface RadioProps {
  label: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  name: string;
}

export interface StampSalesProps {
  // For StampSalesTable
  dispenses?: Array<{
    source: string;
    destination: string;
    dispense_quantity: number;
    satoshirate: number;
    tx_hash: string;
    block_time: number | null;
  }>;
  // For StampSalesGallery
  initialData?: Array<any>;
  title?: string;
  subTitle?: string;
  variant?: string;
  displayCounts?: {
    mobileSm: number;
    mobileMd: number;
    mobileLg: number;
    tablet: number;
    desktop: number;
  };
  gridClass?: string;
}

export interface ToolSrc20PageProps {
  selectedTab: string;
  trxType: "multisig" | "olga";
  tick?: string | null;
  mintStatus?: any;
  holders?: number;
  error?: string;
}

export interface ToolsSrc101PageProps {
  selectedTab: string;
  trxType: "multisig" | "olga";
  error?: string;
}

export interface ToolStampPageProps {
  selectedTab: string;
  trxType: "multisig" | "olga";
  error?: string;
}

export interface ToolFairmintPageProps {
  fairminters: Array<any>;
  error?: string;
}

export interface WalletProviderProps {
  providerKey: string;
  onSuccess: () => void;
}

export interface WalletDashboardDetailsProps {
  walletData: any; // Replace with proper WalletData type if available
  stampsTotal: number;
  src20Total: number;
  stampsCreated: number;
  setShowItem: (item: string) => void;
}

export interface WalletProfileDetailsProps {
  walletData: any; // Replace with proper WalletData type if available
  stampsTotal: number;
  src20Total: number;
  stampsCreated: number;
  setShowItem: (item: string) => void;
}

export interface WalletDispenserDetailsProps {
  walletData: any; // Replace with proper WalletData type if available
}

export interface TransactionProgressProps {
  steps: Array<{
    id: string;
    label: string;
    status: "pending" | "active" | "completed" | "error";
  }>;
  class?: string;
}

export interface SpinnerProps {
  size?: "sm" | "md" | "lg";
  color?: string;
  class?: string;
}

export interface TextareaProps extends JSX.HTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  placeholder?: string;
  rows?: number;
  cols?: number;
  maxLength?: number;
  required?: boolean;
}

export interface SRC20InputFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  error?: string;
  required?: boolean;
  type?: "text" | "number";
}

export interface SRC20GalleryProps {
  tokens: Array<any>;
  loading?: boolean;
  error?: string;
  onLoadMore?: () => void;
}

export interface SRC101RegisterToolProps {
  onRegister: (data: any) => void;
  loading?: boolean;
  error?: string;
}

export interface StatusMessagesProps {
  messages: Array<{
    type: "info" | "warning" | "error" | "success";
    message: string;
  }>;
  onDismiss?: (index: number) => void;
}

export interface StampOverviewContentProps {
  stamp: any;
  marketData?: any;
  loading?: boolean;
  error?: string;
}

export interface StampListingsAllProps {
  listings: Array<any>;
  loading?: boolean;
  error?: string;
  onSelect?: (listing: any) => void;
}

export interface StampListingsOpenProps {
  openListings: Array<any>;
  loading?: boolean;
  error?: string;
  onSelect?: (listing: any) => void;
}

export interface SRC20OverviewContentProps {
  token: any;
  marketData?: any;
  loading?: boolean;
  error?: string;
}

export interface StyledSortingButtonsProps {
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSortChange: (sortBy: string, sortOrder: "asc" | "desc") => void;
  options: Array<{
    key: string;
    label: string;
  }>;
}

export interface StyledSortingDropdownProps {
  value: string;
  onChange: (value: string) => void;
  options: Array<{
    value: string;
    label: string;
  }>;
  placeholder?: string;
}

export interface StyledSortingErrorProps {
  error: string;
  onRetry?: () => void;
}

export interface StyledSortingLabelProps {
  label: string;
  sortBy: string;
  sortOrder: "asc" | "desc";
  onClick: () => void;
  active?: boolean;
}

export interface SelectProps extends JSX.HTMLAttributes<HTMLSelectElement> {
  options: Array<{
    value: string;
    label: string;
  }>;
  placeholder?: string;
  error?: string;
  label?: string;
}

export interface SortProps {
  sortBy: string;
  sortOrder: "asc" | "desc";
  onSort: (sortBy: string, sortOrder: "asc" | "desc") => void;
}

export interface SortingProviderProps {
  children: ComponentChildren;
  defaultSort?: {
    sortBy: string;
    sortOrder: "asc" | "desc";
  };
  onSortChange?: (sortBy: string, sortOrder: "asc" | "desc") => void;
}

export interface SortingProviderWithURLProps extends SortingProviderProps {
  urlParams?: boolean;
  paramPrefix?: string;
}

export interface SortingLabelProps {
  label: string;
  sortBy: string;
  active?: boolean;
  onClick: () => void;
}

export interface SortingErrorProps {
  error: string;
  onRetry?: () => void;
  className?: string;
}

export interface SortingErrorFallbackProps {
  error: Error;
  resetError: () => void;
}

export interface SettingProps {
  label: string;
  value: any;
  onChange: (value: any) => void;
  type?: "boolean" | "string" | "number" | "select";
  options?: Array<{
    value: any;
    label: string;
  }>;
}

export interface SendBTCModalProps {
  isOpen: boolean;
  onClose: () => void;
  address?: string;
  amount?: number;
  onSend: (to: string, amount: number) => void;
}

export interface ReceiveAddyModalProps {
  isOpen: boolean;
  onClose: () => void;
  address?: string;
}

export interface RecentSaleCardProps {
  sale: any;
  onClick?: () => void;
  className?: string;
}

export interface RecentSalesGalleryProps {
  sales: Array<any>;
  loading?: boolean;
  error?: string;
  onLoadMore?: () => void;
}

export interface ResponsiveProps {
  mobile?: any;
  tablet?: any;
  desktop?: any;
  children?: ComponentChildren;
}

export interface SalesActivityFeedProps {
  activities: Array<any>;
  loading?: boolean;
  error?: string;
  onRefresh?: () => void;
}

export interface ScreenReaderProps {
  text: string;
  className?: string;
}

export interface ScrollContainerProps {
  children: ComponentChildren;
  direction?: "horizontal" | "vertical" | "both";
  className?: string;
  maxHeight?: string;
}

export interface SectionHeaderProps {
  title: string;
  subtitle?: string;
  actions?: ComponentChildren;
  className?: string;
}

export interface SelectorButtonsProps {
  options: Array<{
    value: string;
    label: string;
    active?: boolean;
  }>;
  onSelect: (value: string) => void;
  className?: string;
}

export interface StampBTCValueProps {
  stampId: number;
  className?: string;
}

export interface TotalBTCValueProps {
  items: Array<{ value: number }>;
  className?: string;
}

export interface TransactionHexDisplayProps {
  hex: string;
  className?: string;
  collapsed?: boolean;
}

/**
 * Icon component props
 */
export interface CloseIconProps {
  className?: string;
  onClick?: () => void;
  size?: number;
}

export interface GearIconProps {
  className?: string;
  onClick?: () => void;
  size?: number;
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

/**
 * Grid layout props
 */

/**
 * Container props for layout components
 */

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

/**
 * Button element props (button tag)
 */

/**
 * Anchor element props (link that looks like button)
 */

/**
 * Union type for button props
 */

/**
 * Icon button specific props
 */

/**
 * Processing button props for forms
 */

// =============================================================================
// FORM COMPONENT TYPES
// =============================================================================

/**
 * Base form control props
 */

/**
 * Input field props
 */

/**
 * Select field props
 */

/**
 * Textarea props
 */

// =============================================================================
// MODAL AND DIALOG TYPES
// =============================================================================

/**
 * Base modal props
 */

/**
 * Confirmation dialog props
 */

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

/**
 * Notification banner props
 */

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

/**
 * Pagination props
 */

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

/**
 * Screen reader support props
 */

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

// =============================================================================
// BITCOIN STAMPS UI SPECIFIC TYPES
// =============================================================================

/**
 * Stamp gallery component props (migrated from globals.d.ts)
 */

/**
 * Collection gallery component props (migrated from globals.d.ts)
 */

/**
 * SRC-20 card component size variants
 */
export type SRC20CardSize = "sm" | "md" | "lg";

/**
 * SRC-20 card component props
 */

/**
 * Wallet component props
 */

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
export interface PolymorphicProps<
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

/**
 * Error state props
 */

/**
 * Empty state props
 */

/**
 * Combined async state props
 */

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

/**
 * Transition props
 */

// =============================================================================
// COMPONENT PROPS INTERFACES
// =============================================================================

// CARD COMPONENT PROPS
// =====================

/**
 * SRC-20 Card component props
 */

/**
 * SRC-20 Card Minting component props
 */

/**
 * SRC-20 Small Card component props
 */

/**
 * SRC-20 Small Card Minting component props
 */

/**
 * Recent Sale Card component props
 */

/**
 * Wallet Stamp Card component props
 */

// GALLERY COMPONENT PROPS
// ========================

/**
 * Carousel Home component props
 */

/**
 * Collections Banner component props
 */

/**
 * Carousel component props
 */

/**
 * Fresh SRC-20 Gallery component props
 */

/**
 * Fresh Stamp Gallery component props
 */

/**
 * Recent Sales Gallery component props
 */

/**
 * SRC-20 Gallery component props
 */

/**
 * Stamp Overview Gallery component props
 */

// TABLE COMPONENT PROPS
// =====================

/**
 * SRC-20 Minting Table component props
 */

/**
 * SRC-20 Minted Table component props
 */

/**
 * SRC-20 Mints component props
 */

/**
 * SRC-20 Transfers component props
 */

/**
 * Stamp Sales component props
 */

/**
 * Stamp Transfers component props
 */

/**
 * Stamp Listings Open component props
 */

/**
 * Stamp Listings All component props
 */

/**
 * Holders Table component props
 */

/**
 * Holders Table Base component props
 */

/**
 * Pie Chart component props
 */

// CONTENT COMPONENT PROPS
// ========================

/**
 * Explorer Content component props
 */

/**
 * Stamp Overview Content component props
 */

/**
 * SRC-20 Overview Content component props
 */

/**
 * Wallet Dashboard Details component props
 */

/**
 * Wallet Dispenser Details component props
 */

/**
 * Wallet Profile Details component props
 */

/**
 * Section Header component props
 */

/**
 * Stamp Info component props
 */

/**
 * Block component props
 */

/**
 * FAQ Accordion component props
 */

// FORM COMPONENT PROPS
// ====================

/**
 * Input Field component props (extends base InputProps)
 */

/**
 * SRC-20 Input Field component props
 */

/**
 * Select Field component props (extends base SelectProps)
 */

// MODAL COMPONENT PROPS
// =====================

/**
 * Generic modal Props interface (used by multiple modals)
 */

/**
 * Buy Stamp Modal component props
 */
/**
 * Donate Stamp Modal component props
 */
/**
 * Filter SRC-20 Modal component props
 */
/**
 * Receive Address Modal component props
 */
/**
 * Send BTC Modal component props
 */
/**
 * Detail SRC-101 Modal component props
 */
/**
 * Connect Wallet Modal component props
 */

/**
 * Preview Code Modal component props
 */

/**
 * Preview Image Modal component props
 */

/**
 * Image Modal component props
 */

// LAYOUT COMPONENT PROPS
// =======================

/**
 * Chart Widget component props
 */

/**
 * Modal Overlay component props
 */

/**
 * Wallet Provider component props
 */

/**
 * Meta Tags component props
 */

/**
 * Scroll Container component props
 */

/**
 * Modal Search Base component props
 */

// DISPLAY COMPONENT PROPS
// ========================

/**
 * BTC Value Display component props
 */

/**
 * Stamp BTC Value component props
 */

/**
 * Wallet Stamp Value component props
 */

/**
 * Total BTC Value component props
 */

/**
 * BTC Value Summary component props
 */

/**
 * Market Data Status component props
 */

// INDICATOR COMPONENT PROPS
// ==========================

/**
 * Mara Mode Indicator component props
 */

/**
 * Transaction Status component props
 */

/**
 * Transaction Badge component props
 */

/**
 * Mara Success Message component props
 */

/**
 * Progress Indicator component props
 */

/**
 * Transaction Progress component props
 */

/**
 * Spinner component props
 */

/**
 * Progressive Estimation Indicator component props
 */

// BUTTON COMPONENT PROPS
// =======================

/**
 * Selector Buttons component props
 */

/**
 * Sort Button component props
 */

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
  toggleButtonId?: string;
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

/**
 * Gear Icon component props
 */

/**
 * Close Icon component props
 */

// TOOL COMPONENT PROPS
// ====================

/**
 * SRC-20 Mint Tool component props
 */

/**
 * Mint Progress component props
 */

/**
 * SRC-101 Register Tool component props
 */

/**
 * Fairmint Tool component props
 */

/**
 * Status Messages component props
 */

// BADGE COMPONENT PROPS
// =====================

/**
 * Activity Badge component props
 */

// HEADER COMPONENT PROPS
// =======================

/**
 * SRC-20 Overview Header component props
 */

// FEED COMPONENT PROPS
// ====================

/**
 * Sales Activity Feed component props
 */

// FILTER COMPONENT PROPS
// =======================

/**
 * Range Input component props
 */

/**
 * Checkbox component props
 */

/**
 * Radio component props
 */

// SORTING COMPONENT PROPS
// ========================

/**
 * Sorting Provider component props
 */

/**
 * Enhanced Sort Button component props
 */

/**
 * Sorting Component props
 */

/**
 * Sorting Dropdown component props
 */

/**
 * Sorting Buttons component props
 */

/**
 * Sorting Label component props
 */

/**
 * Sorting Error component props
 */

/**
 * Sorting Provider with URL component props
 */

/**
 * Convenience Provider component props
 */

/**
 * Styled Sorting Dropdown component props
 */

/**
 * Styled Sorting Buttons component props
 */

/**
 * Styled Sorting Label component props
 */

/**
 * Styled Sorting Error component props
 */

/**
 * Complete Sorting Interface component props
 */

/**
 * Sorting Error Boundary component props
 */

/**
 * Sorting Error Fallback component props
 */

// TOAST COMPONENT PROPS
// ======================

/**
 * Toast Provider component props
 */

/**
 * Toast Component props
 */

// ERROR COMPONENT PROPS
// =====================

/**
 * Error Display component props
 */

// OTHER COMPONENT PROPS
// =====================

/**
 * Setting component props
 */

/**
 * Transaction Hex Display component props
 */

/**
 * Mara Status Link component props
 */

/**
 * Stat Base component props
 */

/**
 * Author component props
 */

/**
 * Article component props
 */

/**
 * Shared List component props
 */

/**
 * Mara Service Unavailable Modal component props
 */

/**
 * Mara Mode Warning Modal component props
 */

/**
 * Stat Title component props
 */

/**
 * Stat Item component props
 */

// PAGE COMPONENT PROPS
// ====================

/**
 * SRC-20 Detail Page component props
 */

/**
 * Tool Stamp Page component props
 */

/**
 * Stamp Detail Page component props
 */
export interface StampDetailPageProps {
  data: {
    stamp: StampRow & { name?: string };
    total: number;
    sends: any;
    dispensers: any;
    dispenses: any;
    holders: any[];
    vaults: any;
    last_block: number;
    stamps_recent: any;
    lowestPriceDispenser: any;
    htmlTitle?: string;
    error?: string;
    initialCounts?: {
      dispensers: number;
      sales: number;
      transfers: number;
    };
  };
  url?: string;
}

/**
 * Tool Fairmint Page component props
 */

/**
 * Collection Overview Page component props
 */

/**
 * Tools SRC-101 Page component props
 */

/**
 * Color Swatch component props
 */

/**
 * Tool SRC-20 Page component props
 */

// =============================================================================

/**
 * FairmintFormState - Migrated from useFairmintForm.ts
 */
export interface FairmintFormState {
  asset: string;
  quantity: string;
  fee: number;
  BTCPrice: number;
  jsonSize: number;
  utxoAncestors?: AncestorInfo[];
  psbtFeeDetails?: {
    estMinerFee: number;
    totalDustValue: number;
    hasExactFees: boolean;
  };
  isLoading?: boolean;
}

/**
 * SRC101FormState - Migrated from userSRC101Form.ts
 */
export interface SRC101FormState {
  toAddress: string;
  token: string;
  amt: string;
  fee: number;
  feeError: string;
  BTCPrice: number;
  jsonSize: number;
  apiError: string;
  toAddressError: string;
  tokenError: string;
  amtError: string;
  max: string;
  maxError: string;
  lim: string;
  limError: string;
  dec: string;
  x: string;
  tg: string;
  web: string;
  email: string;
  file: File | null;
  psbtFees?: PSBTFees;
  maxAmount?: string;
  root: string;
  utxoAncestors?: Array<any>; // Add missing utxoAncestors property
  isLoading?: boolean;
}

/**
 * SRC20FormState - Migrated from useSRC20Form.ts
 */
export interface SRC20FormState {
  toAddress: string;
  token: string;
  amt: string;
  fee: number;
  feeError: string;
  BTCPrice: number;
  jsonSize: number;
  apiError: string;
  toAddressError: string;
  tokenError: string;
  amtError: string;
  max: string;
  maxError: string;
  lim: string;
  limError: string;
  dec: string;
  x: string;
  xError: string;
  tg: string;
  web: string;
  email: string;
  img: string;
  description: string;
  file: File | null;
  psbtFees?: PSBTFees;
  maxAmount?: string;
}

/**
 * TransactionFormState - Migrated from useTransactionForm.ts
 */
export interface TransactionFormState {
  fee: number;
  feeError: string;
  BTCPrice: number;
  recipientAddress?: string;
  addressError?: string;
  amount?: string;
  amountError?: string;
  assetId?: string;
  estimatedTxFees: FeeDetails | null;
  apiError: string | null;
}

/**
 * UseTransactionFormProps - Migrated from useTransactionForm.ts
 */
export interface UseTransactionFormProps {
  type: "send" | "transfer" | "buy";
  initialFee?: number;
  initialAssetId?: string;
  initialAmount?: string;
}

/**
 * ExtendedButtonProps - Migrated from ButtonBase.tsx
 */
export type ExtendedButtonProps = ButtonProps & {
  isActive?: boolean;
  type?: "button" | "submit" | "reset";
  ref?:
    | JSX.HTMLAttributes<HTMLButtonElement>["ref"]
    | JSX.HTMLAttributes<HTMLAnchorElement>["ref"];
};

/**
 * ExtendedIconButtonProps - Migrated from ButtonBase.tsx
 */
export type ExtendedIconButtonProps = ExtendedButtonProps & {
  isLoading?: boolean;
};

/**
 * ExtendedProcessingButtonProps - Migrated from ButtonBase.tsx
 */
export type ExtendedProcessingButtonProps = ExtendedButtonProps & {
  isSubmitting: boolean;
  type?: "button" | "submit" | "reset";
};

/**
 * ViewAllButtonProps - Migrated from ViewAllButton.tsx
 */
export type ViewAllButtonProps = {
  href: string;
};

/**
 * ProgressState - Migrated from ProgressIndicator.tsx
 */
export type ProgressState = "idle" | "loading" | "success" | "error";

/**
 * TransactionState - Migrated from TransactionStatus.tsx
 */
export type TransactionState = "submitted" | "pending" | "confirmed" | "failed";

/**
 * SRC20CardBaseProps - Migrated from SRC20CardBase.tsx
 */
export interface SRC20CardBaseProps {
  // For individual card usage (SRC20CardBase component)
  src20?: SRC20Row;
  // For bulk card usage (SRC20Card, SRC20CardSm components)
  data?: SRC20Row[];
  // fromPage is reserved for future use
  fromPage?: "src20" | "wallet" | "stamping/src20" | "home";
  // timeframe is reserved for future use
  timeframe?: Timeframe;
  onImageClick?: (imgSrc: string) => void;
  children?: preact.ComponentChildren;
  totalColumns?: number;
  // Current sort state for table headers
  currentSort?: {
    filter: string;
    direction: "asc" | "desc";
  };
}

/**
 * EnhancedWalletContentProps - Migrated from WalletProfileContent.tsx
 */
export interface EnhancedWalletContentProps extends WalletContentProps {
  /** Enable advanced sorting features (default: false for backward compatibility) */
  enableAdvancedSorting?: boolean;
  /** Show performance metrics for sorting operations */
  showSortingMetrics?: boolean;
  /** Additional sorting configuration */
  sortingConfig?: {
    enableUrlSync?: boolean;
    enablePersistence?: boolean;
    enableMetrics?: boolean;
  };
}

/**
 * SRC20DetailHeaderProps - Migrated from SRC20DetailHeader.tsx
 */
export interface SRC20DetailHeaderProps {
  deployment: Deployment & {
    email?: string;
    web?: string;
    tg?: string;
    x?: string;
    stamp_url?: string;
    deploy_img?: string;
  };
  _mintStatus: SRC20MintStatus;
  _totalMints: number;
  _totalTransfers: number;
  marketInfo?: MarketListingAggregated;
  _align?: AlignmentType;
}

/**
 * StampOverviewHeaderProps - Migrated from StampOverviewHeader.tsx
 */
export type StampOverviewHeaderProps = {
  currentFilters?: StampFilters;
};

/**
 * GlobalModalState - Migrated from states.ts
 */
export interface GlobalModalState {
  isOpen: boolean;
  content: ComponentChildren | null;
  animation: ModalAnimation;
}

/**
 * SearchState - Migrated from states.ts
 */
export interface SearchState {
  term: string;
  error: string;
  results?: Array<{ tick: string }>;
}

/**
 * ExtendedBaseFeeCalculatorProps - Migrated from FeeCalculatorBase.tsx
 */
export interface ExtendedBaseFeeCalculatorProps extends BaseFeeCalculatorProps {
  isModal?: boolean;
  disabled?: boolean;
  cancelText?: string;
  confirmText?: string;
  type?: string;
  fileType?: string | undefined;
  fileSize?: number | undefined;
  issuance?: number | undefined;
  bitname?: string | undefined;
  amount?: number;
  receive?: number;
  fromPage?: string;
  price?: number;
  edition?: number;
  ticker?: string;
  limit?: number;
  supply?: number;
  src20TransferDetails?: {
    address: string;
    token: string;
    amount: number;
  };
  stampTransferDetails?: {
    address: string;
    stamp: string;
    editions: number;
  };
  dec?: number;
  onTosChange?: (agreed: boolean) => void;
  feeDetails?: FeeDetails;
  mintDetails?: MintDetails;
  maraMode?: boolean;
  maraFeeRate?: number | null;
  isLoadingMaraFee?: boolean;
  progressIndicator?: preact.ComponentChildren;
}

/**
 * SortingErrorBoundaryState - Migrated from SortingErrorBoundary.tsx
 */
export interface SortingErrorBoundaryState {
  hasError: boolean;
  error: ErrorInfo | null;
  retryCount: number;
  lastErrorTime: number;
}

/**
 * SRC20BalanceTableProps - Migrated from UploadImageTable.tsx
 */
export type SRC20BalanceTableProps = {
  data: SRC20Row[];
};

/**
 * AnimationState - Migrated from useAnimationControls.ts
 */
export interface AnimationState {
  pageVisible: boolean;
  reducedMotion: boolean;
  performanceMode: "high" | "medium" | "low";
}

/**
 * FeeEstimatorState - Migrated from useTransactionConstructionService.ts
 */
export interface FeeEstimatorState {
  phase1: FeeEstimationResult | null;
  phase2: FeeEstimationResult | null;
  phase3: FeeEstimationResult | null;
  currentPhase: "instant" | "smart" | "exact"; // Updated: "cached" -> "smart"
  isEstimating: boolean;
  isPreFetching: boolean;
  error: string | null;
  lastUpdate: number;
}

/**
 * BaseFeeCalculatorProps - Migrated from base.d.ts
 */
export interface BaseFeeCalculatorProps {
  fee: number;
  handleChangeFee: (fee: number) => void;
  BTCPrice: number;
  isSubmitting: boolean;
  onSubmit: () => void;
  onCancel?: () => void;
  buttonName: string;
  className?: string;
  showCoinToggle?: boolean;
  tosAgreed?: boolean;
  onTosChange?: (agreed: boolean) => void;
  feeDetails?: FeeDetails;
  transferDetails?: TransferDetails;
  stampTransferDetails?: StampTransferDetails;
  mintDetails?: MintDetails;
}

/**
 * SimpleFeeCalculatorProps - Migrated from base.d.ts
 */
export interface SimpleFeeCalculatorProps extends BaseFeeCalculatorProps {
  type: "send" | "transfer" | "buy" | "src20";
  _type?: string;
  amount?: number;
  recipientAddress?: string;
  userAddress?: string;
  inputType?: ScriptType;
  outputTypes?: ScriptType[];
  utxoAncestors?: AncestorInfo[];
  bitname?: string;
  receive?: number;
  fromPage?: string;
  price?: number;
  edition?: number;
  ticker?: string;
  limit?: number;
  supply?: number;
  dec?: number; // Added missing decimals property for SRC20 deploy
  transferDetails?: TransferDetails;
  mintDetails?: MintDetails;
  serviceFeeSats?: number;
}

/**
 * AdvancedFeeCalculatorProps - Migrated from base.d.ts
 */
export interface AdvancedFeeCalculatorProps extends BaseFeeCalculatorProps {
  type: string;
  fileType?: string | undefined;
  fileSize?: number | undefined;
  issuance?: number;
  serviceFee?: number | null;
  userAddress?: string | undefined;
  outputTypes?: ScriptType[];
  utxoAncestors?: AncestorInfo[];
  feeDetails?: FeeDetails;
  effectiveFeeRate?: number;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
  inputType?: string;
  bitname?: string;
  fromPage?: string;
}

/**
 * PaginationState - Migrated from pagination.d.ts
 */
export interface PaginationState {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  totalPages: number;
  isLoading: boolean;
  hasError: boolean;
  errorMessage?: string;
}

/**
 * InfiniteScrollState - Migrated from pagination.d.ts
 */
export interface InfiniteScrollState<T> {
  items: T[];
  hasMore: boolean;
  isLoading: boolean;
  cursor?: string;
  error?: string;
}

/**
 * SortState - Migrated from sorting.d.ts
 */
export interface SortState<T extends SortKey = SortKey> {
  /** Currently selected sort key */
  readonly sortBy: T;
  /** Sort direction (derived from sortBy but explicit for state management) */
  readonly direction: SortDirection;
  /** Whether sorting is currently in progress */
  readonly isLoading?: boolean;
  /** Any error that occurred during sorting */
  readonly error?: string | null;
  /** Timestamp of last sort operation */
  readonly lastSorted?: Date | undefined;
}

/**
 * Base sorting component props
 */
export interface SortingComponentProps<T = any> {
  children?: ComponentChildren;
  className?: string;
  testId?: string;
  "aria-label"?: string;
}



/**
 * EnhancedSortState - Migrated from sorting.d.ts
 */
export interface EnhancedSortState<T extends SortKey = SortKey>
  extends SortState<T> {
  /** Whether URL sync is enabled */
  readonly urlSyncEnabled: boolean;
  /** Whether localStorage persistence is enabled */
  readonly persistenceEnabled: boolean;
  /** Performance metrics */
  readonly metrics: SortMetrics | undefined;
  /** History of recent sorts */
  readonly sortHistory: ReadonlyArray<T>;
  /** Cache state */
  readonly cache: {
    readonly hits: number;
    readonly misses: number;
    readonly size: number;
  };
}

/**
 * StampingProps - Migrated from stamping.ts
 */
export interface StampingProps {
  transactions: StampTransaction[];
}

/**
 * SRC20MintingProps - Migrated from stamping.ts
 */
export interface SRC20MintingProps {
  // For stamping transaction tracking
  transactions?: SRC20Transaction[];
  // For minting card components (SRC20CardMinting, SRC20CardSmMinting)
  data?: SRC20Row[];
  fromPage?: "src20" | "wallet" | "stamping/src20" | "home";
  timeframe?: Timeframe;
  onImageClick?: (imgSrc: string) => void;
  // Current sort state for table headers
  currentSort?: {
    filter: string;
    direction: "asc" | "desc";
  };
}

/**
 * TransferProps - Migrated from stamping.ts
 */
export interface TransferProps {
  transactions: StampTransaction[];
}

/**
 * DeployProps - Migrated from stamping.ts
 */
export interface DeployProps {
  transactions: StampTransaction[];
}

/**
 * NumberProps - Migrated from utils_demo.ts
 */
export type NumberProps = PickByValue<MixedTypes, number>;

/**
 * NonNumberProps - Migrated from utils_demo.ts
 */
export type NonNumberProps = OmitByValue<MixedTypes, number>;

/**
 * WalletConnectionState - Migrated from wallet.d.ts
 */
export interface WalletConnectionState {
  isConnected: boolean;
  isConnecting: boolean;
  error?: string;
  wallet?: WalletInfo;
  supportedWallets: WalletProviderKey[];
}

/**
 * WalletSearchState - Migrated from wallet.d.ts
 */
export interface WalletSearchState {
  query: string;
  filters: WalletFilterOptions;
  sortBy: WalletSortKey;
  isLoading: boolean;
  error?: string;
  results: WalletStampWithValue[];
  totalResults: number;
}

/**
 * WalletNavigationState - Migrated from wallet.d.ts
 */
export interface WalletNavigationState {
  currentTab: "stamps" | "activity" | "dispensers" | "stats";
  stampView: "grid" | "list" | "table";
  showFilters: boolean;
  showSearch: boolean;
  selectedStamps: number[];
  bulkActions: {
    isEnabled: boolean;
    availableActions: string[];
    isProcessing: boolean;
  };
  breadcrumbs: {
    label: string;
    href: string;
  }[];
}

/**
 * WalletPageProps - Migrated from wallet.d.ts
 */
export interface WalletPageProps {
  walletData: WalletOverviewInfo;
  stampsTotal: number;
  src20Total: number;
  stampsCreated: number;
  data: {
    stamps: any;
    src20: any;
    dispensers: any;
  };
  stampsSortBy?: "ASC" | "DESC";
  src20SortBy?: "ASC" | "DESC";
}

/**
 * WalletContentProps - Migrated from wallet.d.ts
 */
export interface WalletContentProps {
  stamps: any;
  src20: any;
  dispensers: any;
  address: string;
  anchor?: string;
  stampsSortBy?: "ASC" | "DESC";
  src20SortBy?: "ASC" | "DESC";
  dispensersSortBy?: "ASC" | "DESC";
}

/**
 * WalletAuthState - Migrated from wallet.d.ts
 */
export interface WalletAuthState {
  isLocked: boolean;
  lastUnlocked?: Date;
  sessionTimeout?: number; // Session timeout in milliseconds
  requiresPin: boolean;
  requiresBiometric: boolean;
  maxFailedAttempts: number;
  failedAttempts: number;
}

/**
 * CollectionLandingPageProps - Migrated from index.tsx
 */
export type CollectionLandingPageProps = {
  data: {
    collections: CollectionWithOptionalMarketData[];
    total: number;
    _page: number;
    _pages: number;
    _page_size: number;
    _filterBy: string[];
    sortBy: "ASC" | "DESC";
    stamps_src721: StampRow[];
    stamps_posh: StampRow[];
  };
};

/**
 * State - Migrated from sharedContentHandler.ts
 */
export interface State {
  baseUrl: string;
}

/**
 * CircuitBreakerState - Migrated from circuitBreaker.ts
 */
export interface CircuitBreakerState {
  state: CircuitState;
  failureCount: number;
  successCount: number;
  lastFailureTime?: Date;
  lastSuccessTime?: Date;
  lastStateChange: Date;
  requestCount: number;
  totalFailures: number;
  totalSuccesses: number;
  averageResponseTime: number;
  recentFailures: number[];
  permanentDisableReason?: string;
}

/**
 * ListProps - Migrated from ListBase.tsx
 */
export interface ListProps {
  title: string;
  image: string;
  description: string | string[];
}

/**
 * StampSendsGalleryProps - Migrated from StampSends.tsx
 */
export interface StampSendsGalleryProps {
  serverData?: StampTransaction[];
}

/**
 * StampSortingAdapterProps - Migrated from StampSortingAdapter.tsx
 */
export interface StampSortingAdapterProps {
  stamps: StampRow[];
  onSortChange?: (sortedStamps: StampRow[]) => void;
  enableAdvancedSorting?: boolean;
  sortingConfig?: {
    cacheSize?: number;
    enableMetrics?: boolean;
    performanceThreshold?: number;
  };
}

/**
 * WalletSortingAdapterProps - Migrated from WalletSortingAdapter.tsx
 */
export interface WalletSortingAdapterProps {
  stamps: WalletStampWithValue[];
  address: string;
  onSortChange?: (sortedStamps: WalletStampWithValue[]) => void;
  enableAdvancedSorting?: boolean;
  sortingConfig?: {
    cacheSize?: number;
    enableMetrics?: boolean;
    performanceThreshold?: number;
  };
}

/**
 * EnhancedSortButtonProps - Migrated from EnhancedSortButton.tsx
 */
export interface EnhancedSortButtonProps {
  enableAdvancedSorting?: boolean;
  showMetrics?: boolean;
  className?: string;
}

/**
 * CollectionDetailsPageProps - Migrated from [id].tsx
 */
export type CollectionDetailsPageProps = {
  data: {
    id: string;
    collection: any;
    stamps: StampRow[];
    total: number;
    page: number;
    pages: number;
    page_size: number;
    selectedTab: "all" | "classic" | "posh";
    sortBy: string;
    filterBy: string[];
  };
};

/**
 * ProjectState - Migrated from performanceTracker.ts
 */
export interface ProjectState {
  /** Total number of TypeScript files */
  totalFiles: number;
  /** Total lines of code */
  totalLOC: number;
  /** Domain migration progress percentage */
  migrationProgress: number;
  /** Git commit hash */
  commitHash: string;
  /** Dependency versions */
  dependencies: Record<string, string>;
}

/**
 * LoadingState - Migrated from errorHandlingUtils.ts
 */
export interface LoadingState {
  isLoading: boolean;
  loadingMessage?: string | undefined;
  progress?: number | undefined;
  startTime?: Date | undefined;
  timeout?: number | undefined;
}

/**
 * ProgressiveFeeEstimationProps - Migrated from fee-estimation-utils.ts
 */
export interface ProgressiveFeeEstimationProps {
  isEstimating?: boolean;
  isPreFetching?: boolean;
  currentPhase?: "instant" | "cached" | "exact";
  phase1Result?: ProgressiveFeeEstimationResult | null;
  phase2Result?: ProgressiveFeeEstimationResult | null;
  phase3Result?: ProgressiveFeeEstimationResult | null;
  feeEstimationError?: Error | null;
  clearError?: () => void;
}

/**
 * FeeState - Migrated from feeSignal.ts
 */
export interface FeeState {
  data: FeeData | null;
  loading: boolean;
  lastUpdated: number | null;
  error: string | null;
  retryCount: number;
  lastKnownGoodData: FeeData | null; // Keep last successful data
}

// EXPORTS
// =============================================================================

// Re-export commonly used Preact types for convenience
export type { ComponentChildren, ComponentProps, JSX } from "preact";

/**
 * AlertState - Migrated from scripts/alert-system.ts
 */
interface AlertState {
  lastSent: Record<string, string>;
  alertCounts: Record<string, number>;
  hourlyCount: number;
  lastHourReset: string;
}

/**
 * AlertContext - Migrated from scripts/alert-system.ts
 */
interface AlertContext {
  environment: string;
  sessionId?: string;
  totalAlerts: number;
  criticalAlerts: number;
  warningAlerts: number;
}

/**
 * FeeState - Migrated from tests/integration/feeInfiniteLoopPrevention.test.ts
 */
interface FeeState {
  data: {
    recommendedFee: number;
    btcPrice: number;
  } | null;
  loading: boolean;
}

/**
 * VersionContext - Migrated from server/middleware/apiVersionMiddleware.ts
 */
export interface VersionContext {
  version: string;
  isDeprecated: boolean;
  endOfLife?: string;
  enhancedFields: string[];
}

/**
 * Context - Migrated from server/middleware/apiVersionMiddleware.ts
 */
export type Context = any;
type Next = any;

/**
 * CircuitState - Migrated from server/utils/circuitBreaker.ts
 */
export enum CircuitState {
  CLOSED = "CLOSED", // Normal operation - requests allowed
  OPEN = "OPEN", // Circuit is open - requests blocked
  HALF_OPEN = "HALF_OPEN", // Testing if service has recovered
  PERMANENTLY_OPEN = "PERMANENTLY_OPEN", // Circuit permanently disabled
}

/**
 * WalletContext - Migrated from client/wallet/wallet.ts
 */
export interface WalletContext {
  readonly wallet: Wallet;
  readonly isConnected: boolean;
  updateWallet: (wallet: Wallet) => void;
  getBasicStampInfo: (address: string) => Promise<any>;
  disconnect: () => void;
  signMessage: (message: string) => Promise<any>;
  signPSBT: (
    wallet: Wallet,
    psbt: string,
    inputsToSign: any[],
    enableRBF?: boolean,
    sighashTypes?: number[],
    autoBroadcast?: boolean,
  ) => Promise<any>;
  broadcastRawTX: (rawTx: string) => Promise<any>;
  broadcastPSBT: (psbtHex: string) => Promise<any>;
  showConnectModal: () => void;
}

/**
 * ListProps - Props for List component
 */
export interface ListProps {
  title: string;
  image: string;
  description: string | string[];
}

/**
 * SharedListProps - Props for shared list components
 */
export interface SharedListProps {
  children: preact.ComponentChildren;
  hasImportantNotes?: boolean;
}

/**
 * CompilationContext - Migrated from lib/utils/monitoring/compilation/metricsCollector.ts
 */
export interface CompilationContext {
  sessionId: string;
  startTime: number;
  files: string[];
  config: CompilerConfiguration;
  memorySnapshots: number[];
  fileMetrics: Map<string, Partial<FileCompilationMetrics>>;
}

/**
 * AlertContext - Migrated from scripts/alert-system.ts
 */
export interface AlertContext {
  environment: string;
  sessionId?: string;
  totalAlerts: number;
  criticalAlerts: number;
}

// =============================================================================
// TYPE ALIASES FOR BACKWARD COMPATIBILITY
// =============================================================================

/**
 * Backward compatibility aliases for commonly expected type names
 */
export type SRC20CardProps = SRC20CardBaseProps;
export type SRC20CardMintingProps = SRC20MintingProps;
export type SRC20CardSmProps = SRC20CardBaseProps;
export type SRC20CardSmMintingProps = SRC20MintingProps;
export type SRC20MintsProps = SRC20MintingProps;
export type SRC20TransfersProps = TransferProps;
export type StampTransfersProps = TransferProps;

/**
 * Additional missing prop interfaces as aliases
 */
export interface WalletStampValueProps {
  stampId: number;
  walletAddress: string;
  className?: string;
}

export interface ProgressiveEstimationIndicatorProps {
  isEstimating: boolean;
  progress?: number;
  className?: string;
}
