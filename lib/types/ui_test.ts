/**
 * UI Component Types Test Suite
 *
 * Validates type definitions and interfaces for UI components
 * Tests compatibility with Fresh framework and Preact components
 */

import { assertEquals, assertExists } from "@std/assert";
import type {
  // Animation Types
  AnimationProps,
  // Accessibility Types
  AriaAttributes,
  AsyncStateProps,
  // Core UI Framework Types
  BaseComponentProps,
  ButtonColor,
  // Button Types
  ButtonProps,
  ButtonSize,
  ButtonVariant,
  ColorPalette,
  ConfirmDialogProps,
  DisplayCountBreakpoints,
  ErrorStateProps,
  ExtendedComponentProps,
  // Layout Types
  FlexboxProps,
  // Form Types
  FormControlProps,
  GridProps,
  IconButtonProps,
  // Icon Types
  IconProps,
  IconSize,
  IconWeight,
  InputProps,
  KeyboardNavigationProps,
  // Common Pattern Types
  LoadingStateProps,
  // Modal Types
  ModalBaseProps,
  ResponsiveProps,
  // Responsive Design Types
  ResponsiveValue,
  ScreenReaderProps,
  SelectProps,
  SRC20CardProps,
  // Bitcoin Stamps UI Types
  StampGalleryProps,
  TableColumn,
  // Table Types
  TableProps,
  // Notification Types
  ToastProps,
  ToastVariant,
  TransitionProps,
  Typography,
} from "./ui.d.ts";

Deno.test("UI Types - Core Component Props", () => {
  // Test BaseComponentProps
  const baseProps: BaseComponentProps = {
    class: "test-class",
    className: "test-classname",
    children: "Test content",
    "data-testid": "test-component",
    "data-custom": "custom-value",
  };

  assertExists(baseProps.class);
  assertExists(baseProps.className);
  assertExists(baseProps.children);
  assertExists(baseProps["data-testid"]);

  // Test ExtendedComponentProps
  const extendedProps: ExtendedComponentProps = {
    ...baseProps,
    id: "test-id",
    role: "button",
    "aria-label": "Test button",
    tabIndex: 0,
  };

  assertExists(extendedProps.id);
  assertExists(extendedProps.role);
  assertExists(extendedProps["aria-label"]);
  assertEquals(extendedProps.tabIndex, 0);
});

Deno.test("UI Types - Theme System", () => {
  // Test ColorPalette structure
  const colorPalette: ColorPalette = {
    primary: {
      50: "#f0f0f0",
      100: "#e0e0e0",
      200: "#d0d0d0",
      300: "#c0c0c0",
      400: "#b0b0b0",
      500: "#a0a0a0",
      600: "#909090",
      700: "#808080",
      800: "#707070",
      900: "#606060",
    },
    stamp: {
      purple: "#8800CC",
      "purple-dark": "#660099",
      "purple-light": "#AA00FF",
      "purple-highlight": "#BB11FF",
      grey: "#999999",
      "grey-dark": "#666666",
      "grey-light": "#CCCCCC",
    },
    semantic: {
      success: "#00CC00",
      warning: "#FFAA00",
      error: "#CC0000",
      info: "#0099CC",
    },
    neutral: {
      white: "#FFFFFF",
      black: "#000000",
      transparent: "transparent",
    },
  };

  assertExists(colorPalette.primary[500]);
  assertExists(colorPalette.stamp.purple);
  assertExists(colorPalette.semantic.success);
  assertExists(colorPalette.neutral.white);

  // Test Typography structure
  const typography: Typography = {
    fontFamily: {
      sans: ["Inter", "system-ui", "sans-serif"],
      mono: ["Monaco", "monospace"],
    },
    fontSize: {
      xs: "0.75rem",
      sm: "0.875rem",
      base: "1rem",
      lg: "1.125rem",
      xl: "1.25rem",
      "2xl": "1.5rem",
      "3xl": "1.875rem",
      "4xl": "2.25rem",
    },
    fontWeight: {
      normal: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    lineHeight: {
      tight: 1.25,
      normal: 1.5,
      relaxed: 1.75,
    },
    letterSpacing: {
      tight: "-0.025em",
      normal: "0em",
      wide: "0.025em",
      wider: "0.05em",
    },
  };

  assertExists(typography.fontFamily.sans);
  assertExists(typography.fontSize.base);
  assertEquals(typography.fontWeight.bold, 700);
});

Deno.test("UI Types - Button Component Types", () => {
  // Test ButtonVariant type
  const variants: ButtonVariant[] = [
    "text",
    "flat",
    "outline",
    "flatOutline",
    "outlineFlat",
    "outlineGradient",
  ];
  assertEquals(variants.length, 6);

  // Test ButtonColor type
  const colors: ButtonColor[] = [
    "grey",
    "greyDark",
    "greyGradient",
    "purple",
    "purpleDark",
    "purpleGradient",
    "test",
    "custom",
  ];
  assertEquals(colors.length, 8);

  // Test ButtonSize type
  const sizes: ButtonSize[] = [
    "xxs",
    "xs",
    "sm",
    "md",
    "lg",
    "xl",
    "xxsR",
    "xsR",
    "smR",
    "mdR",
    "lgR",
  ];
  assertEquals(sizes.length, 11);

  // Test ButtonProps interface
  const buttonProps: ButtonProps = {
    variant: "flat",
    color: "purple",
    size: "md",
    disabled: false,
    children: "Click me",
    onClick: () => console.log("clicked"),
  };

  assertEquals(buttonProps.variant, "flat");
  assertEquals(buttonProps.color, "purple");
  assertEquals(buttonProps.size, "md");
  assertExists(buttonProps.onClick);

  // Test IconButtonProps
  const iconButtonProps: IconButtonProps = {
    ...buttonProps,
    icon: "★",
    isLoading: false,
  };

  assertExists(iconButtonProps.icon);
  assertEquals(iconButtonProps.isLoading, false);
});

Deno.test("UI Types - Layout Types", () => {
  // Test FlexboxProps
  const flexProps: FlexboxProps = {
    direction: "row",
    justify: "center",
    align: "center",
    wrap: "wrap",
    gap: "4",
  };

  assertEquals(flexProps.direction, "row");
  assertEquals(flexProps.justify, "center");
  assertEquals(flexProps.gap, "4");

  // Test GridProps
  const gridProps: GridProps = {
    cols: 12,
    rows: 4,
    gap: "6",
    gapX: "4",
    gapY: "8",
  };

  assertEquals(gridProps.cols, 12);
  assertEquals(gridProps.rows, 4);
  assertEquals(gridProps.gap, "6");

  // Test DisplayCountBreakpoints
  const displayCounts: DisplayCountBreakpoints = {
    mobileSm: 1,
    mobileMd: 2,
    mobileLg: 3,
    tablet: 4,
    desktop: 6,
  };

  assertEquals(displayCounts.mobileSm, 1);
  assertEquals(displayCounts.desktop, 6);
});

Deno.test("UI Types - Form Component Types", () => {
  // Test FormControlProps
  const formControlProps: FormControlProps = {
    name: "email",
    label: "Email Address",
    placeholder: "Enter your email",
    required: true,
    disabled: false,
    error: undefined,
    help: "We'll never share your email",
    value: "",
    onChange: () => {},
  };

  assertEquals(formControlProps.name, "email");
  assertEquals(formControlProps.required, true);
  assertExists(formControlProps.onChange);

  // Test InputProps
  const inputProps: InputProps = {
    ...formControlProps,
    type: "email",
    pattern: "[a-z0-9._%+-]+@[a-z0-9.-]+\\.[a-z]{2,}$",
  };

  assertEquals(inputProps.type, "email");
  assertExists(inputProps.pattern);

  // Test SelectProps
  const selectProps: SelectProps = {
    ...formControlProps,
    options: [
      { value: "option1", label: "Option 1" },
      { value: "option2", label: "Option 2", disabled: true },
    ],
    multiple: false,
  };

  assertEquals(selectProps.options.length, 2);
  assertEquals(selectProps.multiple, false);
  assertEquals(selectProps.options[1].disabled, true);
});

Deno.test("UI Types - Modal and Dialog Types", () => {
  // Test ModalBaseProps
  const modalProps: ModalBaseProps = {
    title: "Confirm Action",
    isOpen: true,
    onClose: () => {},
    hideHeader: false,
    contentClassName: "custom-modal-content",
    closeOnOverlayClick: true,
    closeOnEscape: true,
  };

  assertEquals(modalProps.title, "Confirm Action");
  assertEquals(modalProps.isOpen, true);
  assertExists(modalProps.onClose);

  // Test ConfirmDialogProps
  const confirmProps: ConfirmDialogProps = {
    ...modalProps,
    message: "Are you sure you want to delete this item?",
    confirmText: "Delete",
    cancelText: "Cancel",
    onConfirm: () => {},
    onCancel: () => {},
    variant: "warning",
  };

  assertEquals(confirmProps.variant, "warning");
  assertExists(confirmProps.onConfirm);
  assertExists(confirmProps.onCancel);
});

Deno.test("UI Types - Notification Types", () => {
  // Test ToastVariant
  const variants: ToastVariant[] = ["info", "success", "warning", "error"];
  assertEquals(variants.length, 4);

  // Test ToastProps
  const toastProps: ToastProps = {
    message: "Operation successful!",
    variant: "success",
    duration: 5000,
    dismissible: true,
    onDismiss: () => {},
    position: "top-right",
  };

  assertEquals(toastProps.variant, "success");
  assertEquals(toastProps.duration, 5000);
  assertEquals(toastProps.position, "top-right");
});

Deno.test("UI Types - Table Component Types", () => {
  // Test TableColumn
  const columns: TableColumn[] = [
    {
      key: "name",
      header: "Name",
      width: "200px",
      align: "left",
      sortable: true,
    },
    {
      key: "email",
      header: "Email",
      align: "center",
      render: (value) => `mailto:${value}`,
    },
  ];

  assertEquals(columns[0].key, "name");
  assertEquals(columns[0].sortable, true);
  assertExists(columns[1].render);

  // Test TableProps
  const tableProps: TableProps = {
    data: [
      { name: "John", email: "john@example.com" },
      { name: "Jane", email: "jane@example.com" },
    ],
    columns,
    loading: false,
    emptyMessage: "No data available",
    rowKey: "email",
    striped: true,
    hoverable: true,
    compact: false,
  };

  assertEquals(tableProps.data.length, 2);
  assertEquals(tableProps.striped, true);
  assertEquals(tableProps.rowKey, "email");
});

Deno.test("UI Types - Accessibility Types", () => {
  // Test AriaAttributes
  const ariaProps: AriaAttributes = {
    "aria-role": "button",
    "aria-label": "Close dialog",
    "aria-expanded": false,
    "aria-hidden": false,
    "aria-selected": undefined,
    "aria-disabled": false,
    "aria-checked": "mixed",
    "aria-current": "page",
  };

  assertEquals(ariaProps["aria-role"], "button");
  assertEquals(ariaProps["aria-expanded"], false);
  assertEquals(ariaProps["aria-checked"], "mixed");

  // Test KeyboardNavigationProps
  const keyboardProps: KeyboardNavigationProps = {
    tabIndex: 0,
    onKeyDown: () => {},
    onKeyUp: () => {},
    onKeyPress: () => {},
  };

  assertEquals(keyboardProps.tabIndex, 0);
  assertExists(keyboardProps.onKeyDown);

  // Test ScreenReaderProps
  const screenReaderProps: ScreenReaderProps = {
    srOnly: "Loading content",
    "aria-live": "polite",
    "aria-atomic": true,
  };

  assertEquals(screenReaderProps["aria-live"], "polite");
  assertEquals(screenReaderProps["aria-atomic"], true);
});

Deno.test("UI Types - Responsive Design Types", () => {
  // Test ResponsiveValue
  const responsiveSize: ResponsiveValue<string> = {
    mobileSm: "sm",
    mobileLg: "md",
    tablet: "lg",
    desktop: "xl",
  };

  assertEquals(responsiveSize.mobileSm, "sm");
  assertEquals(responsiveSize.desktop, "xl");

  // Test single value ResponsiveValue
  const singleValue: ResponsiveValue<string> = "md";
  assertEquals(singleValue, "md");

  // Test ResponsiveProps
  const responsiveProps: ResponsiveProps = {
    hideOn: ["mobileSm", "mobileMd"],
    showOn: ["tablet", "desktop"],
  };

  assertEquals(responsiveProps.hideOn?.length, 2);
  assertEquals(responsiveProps.showOn?.length, 2);
});

Deno.test("UI Types - Bitcoin Stamps UI Types", () => {
  // Test StampGalleryProps
  const stampGalleryProps: StampGalleryProps = {
    title: "Bitcoin Stamps Gallery",
    subTitle: "Explore digital artifacts on Bitcoin",
    stamps: [],
    layout: "grid",
    isRecentSales: false,
    showDetails: true,
    showEdition: true,
    variant: "default",
    sortBy: "ASC",
    displayCounts: {
      mobileSm: 1,
      mobileLg: 2,
      tablet: 3,
      desktop: 4,
    },
  };

  assertEquals(stampGalleryProps.layout, "grid");
  assertEquals(stampGalleryProps.variant, "default");
  assertEquals(stampGalleryProps.sortBy, "ASC");

  // Test SRC20CardProps
  const src20CardProps: SRC20CardProps = {
    size: "md",
    tokenData: { tick: "STAMP", supply: 1000000 },
    showMintingProgress: true,
    hoverable: true,
    onClick: () => {},
  };

  assertEquals(src20CardProps.size, "md");
  assertEquals(src20CardProps.showMintingProgress, true);
  assertExists(src20CardProps.onClick);
});

Deno.test("UI Types - Icon Component Types", () => {
  // Test IconSize type
  const sizes: IconSize[] = ["xs", "sm", "md", "lg", "xl"];
  assertEquals(sizes.length, 5);

  // Test IconWeight type
  const weights: IconWeight[] = ["thin", "light", "regular", "bold", "fill"];
  assertEquals(weights.length, 5);

  // Test IconProps
  const iconProps: IconProps = {
    size: "md",
    weight: "bold",
    color: "#8800CC",
    onClick: () => {},
    "aria-label": "Star icon",
  };

  assertEquals(iconProps.size, "md");
  assertEquals(iconProps.weight, "bold");
  assertEquals(iconProps.color, "#8800CC");
  assertExists(iconProps.onClick);
});

Deno.test("UI Types - Animation Types", () => {
  // Test AnimationProps
  const animationProps: AnimationProps = {
    duration: "300ms",
    delay: "100ms",
    timingFunction: "ease-in-out",
    iterationCount: "infinite",
    direction: "alternate",
    fillMode: "both",
  };

  assertEquals(animationProps.duration, "300ms");
  assertEquals(animationProps.timingFunction, "ease-in-out");
  assertEquals(animationProps.iterationCount, "infinite");

  // Test TransitionProps
  const transitionProps: TransitionProps = {
    property: ["opacity", "transform"],
    duration: 200,
    timingFunction: "cubic-bezier(0.4, 0, 0.2, 1)",
    delay: "50ms",
  };

  assertEquals(Array.isArray(transitionProps.property), true);
  assertEquals(transitionProps.duration, 200);
  assertExists(transitionProps.timingFunction);
});

Deno.test("UI Types - Common Pattern Types", () => {
  // Test LoadingStateProps
  const loadingProps: LoadingStateProps = {
    isLoading: true,
    loadingMessage: "Loading data...",
    spinnerSize: "md",
  };

  assertEquals(loadingProps.isLoading, true);
  assertEquals(loadingProps.spinnerSize, "md");

  // Test ErrorStateProps
  const errorProps: ErrorStateProps = {
    hasError: true,
    errorMessage: "Failed to load data",
    onRetry: () => {},
  };

  assertEquals(errorProps.hasError, true);
  assertExists(errorProps.onRetry);

  // Test AsyncStateProps combines all state types
  const asyncProps: AsyncStateProps = {
    isLoading: false,
    hasError: false,
    isEmpty: true,
    emptyMessage: "No items found",
    loadingMessage: "Loading...",
    errorMessage: undefined,
  };

  assertEquals(asyncProps.isLoading, false);
  assertEquals(asyncProps.isEmpty, true);
  assertEquals(asyncProps.emptyMessage, "No items found");
});

Deno.test("UI Types - Type Compatibility", () => {
  // Test that ExtendedComponentProps extends BaseComponentProps
  const extendedProps: ExtendedComponentProps = {
    class: "test",
    children: "content",
    id: "test-id",
    role: "button",
  };

  // This should compile without error - ExtendedComponentProps includes BaseComponentProps
  const baseProps: BaseComponentProps = extendedProps;
  assertExists(baseProps.class);
  assertExists(baseProps.children);

  // Test that button props work with both button and anchor elements
  const buttonElementProps: ButtonProps = {
    variant: "flat",
    color: "purple",
    size: "md",
    type: "button",
    onClick: () => {},
  };

  const anchorElementProps: ButtonProps = {
    variant: "outline",
    color: "grey",
    size: "sm",
    href: "/test",
    "f-partial": "/test",
    target: "_blank",
  };

  assertExists(buttonElementProps.onClick);
  assertExists(anchorElementProps.href);
  assertEquals(anchorElementProps.target, "_blank");
});
