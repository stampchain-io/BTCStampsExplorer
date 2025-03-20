import { IS_BROWSER } from "$fresh/runtime.ts";
import { button, ButtonProps } from "./styles.ts";

// Loading Spinner Component
const LoadingSpinner = () => (
  <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-[var(--hover-color)]" />
);

/**
 * Base Button Component
 */
export function Button({
  variant,
  color,
  size,
  disabled,
  isActive,
  ...props
}: ButtonProps & { isActive?: boolean }) {
  const buttonClass = button(variant, color, size, {
    disabled,
    active: isActive,
  });

  return (
    <button
      {...props}
      disabled={!IS_BROWSER || disabled}
      class={`${buttonClass} ${props.class || ""}`}
    >
      {props.children}
    </button>
  );
}

/**
 * Icon Button Component
 */
export function ButtonIcon({
  variant,
  color,
  size,
  disabled,
  isLoading,
  isActive,
  children,
  ...props
}: ButtonProps & { isLoading?: boolean; isActive?: boolean }) {
  const buttonClass = button(variant, color, size, {
    disabled,
    loading: isLoading,
    active: isActive,
  });

  return (
    <button
      {...props}
      disabled={!IS_BROWSER || disabled || isLoading}
      class={`${buttonClass} p-0 aspect-square`}
    >
      {isLoading ? <LoadingSpinner /> : children}
    </button>
  );
}

/**
 * Processing Button Component
 */
export function ButtonProcessing({
  variant,
  color,
  size,
  disabled,
  isSubmitting,
  isActive,
  children,
  ...props
}: ButtonProps & { isSubmitting: boolean; isActive?: boolean }) {
  const buttonClass = button(variant, color, size, {
    disabled,
    loading: isSubmitting,
    active: isActive,
  });

  return (
    <button
      {...props}
      disabled={!IS_BROWSER || disabled || isSubmitting}
      class={buttonClass}
    >
      {isSubmitting ? <LoadingSpinner /> : children}
    </button>
  );
}
