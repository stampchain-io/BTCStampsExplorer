/* ===== INPUT FIELD COMPONENT (WIP) ===== */
// WIP: Copy of SRC20InputField.tsx
// TODO(@baba):
// - Test with components
// - Verify code correctness
// - Update with latest DB server requirements
// - Currently not in use - form input fields use original files

import { Ref } from "preact";
import { inputField } from "$form";

/* ===== TYPES ===== */
export interface InputFieldProps {
  type: string;
  placeholder: string;
  value: string;
  onChange: (e: Event) => void;
  onBlur?: (() => void) | undefined;
  error?: string;
  maxLength?: number;
  isUppercase?: boolean;
  inputMode?: "numeric" | "text" | "email";
  pattern?: string;
  onFocus?: (() => void) | undefined;
  ref?: Ref<HTMLInputElement> | undefined;
  "data-amount-input"?: boolean;
  [key: string]: any;
}

/* ===== COMPONENT ===== */
export function InputFieldWIP({
  type,
  placeholder,
  value,
  onChange,
  onBlur,
  error,
  maxLength,
  isUppercase,
  inputMode,
  pattern,
  onFocus,
  ref,
  ...props
}: InputFieldProps) {
  const inputClass = `${inputField} ${isUppercase ? "uppercase" : ""}`;
  const dataAmountInput = props["data-amount-input"];
  const { "data-amount-input": _, ...restProps } = props;

  return (
    <div class="w-full">
      <input
        {...(dataAmountInput && { "data-amount-input": dataAmountInput })}
        type={type}
        class={inputClass}
        placeholder={placeholder}
        value={value}
        onInput={onChange}
        {...(onBlur && { onBlur })}
        {...(onFocus && { onFocus })}
        {...(maxLength && { maxLength })}
        {...(inputMode && { inputMode })}
        {...(pattern && { pattern })}
        {...(ref && { ref })}
        {...restProps}
      />
      {error && <div class="text-red-500 text-xs mt-1">{error}</div>}
    </div>
  );
}
