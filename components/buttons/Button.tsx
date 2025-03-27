/* ===== BUTTON COMPONENTS MODULE ===== */
import { IS_BROWSER } from "$fresh/runtime.ts";
import { button, ButtonProps } from "./styles.ts";

/* ===== LOADING SPINNER COMPONENT ===== */
const LoadingSpinner = () => (
  <div class="animate-spin rounded-full h-5 w-5 border-b-2 border-[var(--hover-color)]" />
);

/* ===== BASE BUTTON COMPONENT ===== */
export function Button({
  variant,
  color,
  size,
  disabled,
  isActive,
  href,
  "f-partial": fPartial,
  class: className,
  children,
  ...props
}: ButtonProps & { isActive?: boolean }) {
  const buttonClass = button(variant, color, size, {
    disabled: disabled ?? undefined,
    active: isActive ?? undefined,
  });

  const combinedClass = `${buttonClass} ${className ?? ""}`;

  if (href) {
    return (
      <a
        href={href}
        f-partial={fPartial || href}
        class={combinedClass}
        {...props}
      >
        {children}
      </a>
    );
  }

  return (
    <button
      type="button"
      disabled={!IS_BROWSER || disabled}
      class={combinedClass}
    >
      {children}
    </button>
  );
}

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
  children,
  ...props
}: ButtonProps & { isLoading?: boolean; isActive?: boolean }) {
  const buttonClass = button(variant, color, size, {
    disabled: disabled ?? undefined,
    loading: isLoading ?? undefined,
    active: isActive ?? undefined,
  });

  return href
    ? (
      <a
        href={href}
        f-partial={fPartial || href}
        class={`${buttonClass} p-0 aspect-square`}
        {...props}
      >
        {isLoading ? <LoadingSpinner /> : children}
      </a>
    )
    : (
      <button
        {...props}
        disabled={!IS_BROWSER || disabled || isLoading}
        class={`${buttonClass} p-0 aspect-square`}
      >
        {isLoading ? <LoadingSpinner /> : children}
      </button>
    );
}

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
  children,
  ...props
}: ButtonProps & { isSubmitting: boolean; isActive?: boolean }) {
  const buttonClass = button(variant, color, size, {
    disabled: disabled ?? undefined,
    loading: isSubmitting ?? undefined,
    active: isActive ?? undefined,
  });

  return href
    ? (
      <a
        href={href}
        f-partial={fPartial || href}
        class={buttonClass}
        {...props}
      >
        {isSubmitting ? <LoadingSpinner /> : children}
      </a>
    )
    : (
      <button
        {...props}
        disabled={!IS_BROWSER || disabled || isSubmitting}
        class={buttonClass}
      >
        {isSubmitting ? <LoadingSpinner /> : children}
      </button>
    );
}

/* ===== BUTTON COMPONENT DOCUMENTATION - UPDATE NEEDED !!! ===== */
/**
 * Button Components
 *
 * @example Normal Button
 * <Button variant="outline" color="grey" size="lg">
 *   CLICK ME
 * </Button>
 *
 * @example Icon Button - NEEDS ICON COMPONENT - to be updated
 * <ButtonIcon variant="outline" color="purple" size="md">
 *   <svg>...</svg>
 * </ButtonIcon>
 *
 * @example Icon Button with Loading Spinner
 * import { useButtonActions } from "$islands/shared/actions/buttonActions.tsx";
 *
 * export default function MyComponent() {
 *   const { isActive, activeHandlers } = useButtonActions();
 *
 *   return (
 *     <ButtonIcon
 *       variant="outline"
 *       color="purple"
 *       size="md"
 *       isLoading={true}
 *       isActive={isActive}
 *       {...activeHandlers}
 *     >
 *       <svg>...</svg>
 *     </ButtonIcon>
 *   );
 * }
 *
 * @example Processing Button
 * <ButtonProcessing
 *   variant="outline"
 *   color="grey"
 *   size="lg"
 *   isSubmitting={false}
 * >
 *   SUBMIT
 * </ButtonProcessing>
 *
 * @example Processing Button with Active State and Spinner
 * import { useButtonActions } from "$islands/shared/actions/buttonActions.tsx";
 *
 * export default function MyComponent() {
 *   const { isActive, activeHandlers } = useButtonActions();
 *   const [isSubmitting, setIsSubmitting] = useState(false);
 *
 *   const handleSubmit = async () => {
 *     setIsSubmitting(true);
 *     await submitData();
 *     setIsSubmitting(false);
 *   };
 *
 *   return (
 *     <ButtonProcessing
 *       variant="outline"
 *       color="grey"
 *       size="lg"
 *       isSubmitting={isSubmitting}
 *       isActive={isActive}
 *       {...activeHandlers}
 *       onClick={handleSubmit}
 *     >
 *       SUBMIT
 *     </ButtonProcessing>
 *   );
 * }
 */
