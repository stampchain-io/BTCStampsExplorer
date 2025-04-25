/* ===== BUTTON COMPONENT ===== */
import { IS_BROWSER } from "$fresh/runtime.ts";
import { JSX } from "preact";
import { button, ButtonProps, buttonStyles } from "$button";

/* ===== SUBCOMPONENTS - @baba - duplicate of loaderSpin in layout/styles.ts ===== */
const LoadingSpinner = () => (
  <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-[var(--hover-color)]" />
);

/* ===== HELPERS ===== */
const getButtonClass = (
  variant: keyof typeof buttonStyles.variant,
  color: keyof typeof buttonStyles.color,
  size: keyof typeof buttonStyles.size,
  states: {
    disabled?: boolean | undefined;
    loading?: boolean | undefined;
    active?: boolean | undefined;
  },
) =>
  button(variant, color, size, {
    disabled: states.disabled,
    loading: states.loading,
    active: states.active,
  });

const getCommonButtonProps = ({
  type = "button",
  disabled,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  role,
  ariaLabel,
  dataType,
  className,
  ref,
  ...props
}: any) => ({
  type,
  disabled,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  role,
  "aria-label": ariaLabel,
  "data-type": dataType,
  class: className,
  ref,
  ...props,
});

/* ===== TYPES ===== */
type ExtendedButtonProps = ButtonProps & {
  isActive?: boolean;
  ref?:
    | JSX.HTMLAttributes<HTMLButtonElement>["ref"]
    | JSX.HTMLAttributes<HTMLAnchorElement>["ref"];
};

/* ===== COMPONENT ===== */
export function Button({
  variant,
  color,
  size,
  disabled,
  isActive,
  href,
  "f-partial": fPartial,
  class: className,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  role,
  ariaLabel,
  "data-type": dataType,
  ref,
  children,
  ...props
}: ExtendedButtonProps) {
  const buttonClass = getButtonClass(variant, color, size, {
    disabled: disabled || undefined,
    active: isActive || undefined,
  });

  const combinedClass = `${buttonClass} ${className ?? ""} group`;

  // Special handling for outlineGradient variant
  if (variant === "outlineGradient") {
    const innerButtonProps = getCommonButtonProps({
      disabled: !IS_BROWSER || disabled,
      onClick,
      onMouseEnter,
      onMouseLeave,
      onFocus,
      onBlur,
      role,
      ariaLabel,
      dataType,
      ref,
      ...props,
    });

    const innerContent = (
      <button {...innerButtonProps}>
        {children}
      </button>
    );

    return href
      ? (
        <a href={href} f-partial={fPartial || href} class={combinedClass}>
          {innerContent}
        </a>
      )
      : (
        <div class={combinedClass}>
          {innerContent}
        </div>
      );
  }

  const commonProps = getCommonButtonProps({
    disabled: !IS_BROWSER || disabled,
    onClick,
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onBlur,
    role,
    ariaLabel,
    dataType,
    className: combinedClass,
    ref,
    ...props,
  });

  return href
    ? (
      <a href={href} f-partial={fPartial || href} {...commonProps}>
        {children}
      </a>
    )
    : (
      <button {...commonProps}>
        {children}
      </button>
    );
}

/* ===== TYPES ===== */
type ExtendedIconButtonProps = ExtendedButtonProps & {
  isLoading?: boolean;
};

/* ===== ICON BUTTON COMPONENT ===== */
export function ButtonIcon({
  variant,
  color,
  size,
  disabled,
  isLoading,
  isActive,
  href,
  "f-partial": fPartial,
  class: className,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  role,
  ariaLabel,
  "data-type": dataType,
  ref,
  children,
  ...props
}: ExtendedIconButtonProps) {
  const buttonClass = getButtonClass(variant, color, size, {
    disabled: disabled || undefined,
    loading: isLoading || undefined,
    active: isActive || undefined,
  });

  const commonProps = getCommonButtonProps({
    disabled: !IS_BROWSER || disabled || isLoading,
    onClick,
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onBlur,
    role,
    ariaLabel,
    dataType,
    className: `${buttonClass} p-0 aspect-square`,
    ref,
    ...props,
  });

  const content = isLoading ? <LoadingSpinner /> : children;

  return href
    ? (
      <a href={href} f-partial={fPartial || href} {...commonProps}>
        {content}
      </a>
    )
    : (
      <button {...commonProps}>
        {content}
      </button>
    );
}

/* ===== TYPES ===== */
type ExtendedProcessingButtonProps = ExtendedButtonProps & {
  isSubmitting: boolean;
};

/* ===== PROCESSING BUTTON COMPONENT ===== */
export function ButtonProcessing({
  variant,
  color,
  size,
  disabled,
  isSubmitting,
  isActive,
  href,
  "f-partial": fPartial,
  class: className,
  onClick,
  onMouseEnter,
  onMouseLeave,
  onFocus,
  onBlur,
  role,
  ariaLabel,
  "data-type": dataType,
  ref,
  children,
  ...props
}: ExtendedProcessingButtonProps) {
  const buttonClass = getButtonClass(variant, color, size, {
    disabled: disabled || undefined,
    loading: isSubmitting || undefined,
    active: isActive || undefined,
  });

  const commonProps = getCommonButtonProps({
    disabled: !IS_BROWSER || disabled || isSubmitting,
    onClick,
    onMouseEnter,
    onMouseLeave,
    onFocus,
    onBlur,
    role,
    ariaLabel,
    dataType,
    className: buttonClass,
    ref,
    ...props,
  });

  const content = isSubmitting ? <LoadingSpinner /> : children;

  return href
    ? (
      <a href={href} f-partial={fPartial || href} {...commonProps}>
        {content}
      </a>
    )
    : (
      <button {...commonProps}>
        {content}
      </button>
    );
}
