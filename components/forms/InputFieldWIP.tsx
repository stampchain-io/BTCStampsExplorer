/* ===== INPUT FIELD COMPONENT (WIP) ===== */
// WIP: Copy of SRC20InputField.tsx
// TODO(@baba):
// - Test with components
// - Verify code correctness
// - Update with latest DB server requirements
// - Currently not in use - form input fields use original files

import { Ref } from "preact";
import { inputField } from "$forms";

/* ===== TYPES ===== */
export interface InputFieldProps {
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
  ref?: Ref<HTMLInputElement>;
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
  return (
    <div class="w-full">
      <input
        type={type}
        class={`${inputField} ${isUppercase ? "uppercase" : ""}`}
        placeholder={placeholder}
        value={value}
        onInput={onChange}
        onBlur={onBlur}
        onFocus={onFocus}
        maxLength={maxLength}
        inputMode={inputMode}
        pattern={pattern}
        ref={ref}
        {...props}
      />
      {error && <div class="text-red-500 text-xs mt-1">{error}</div>}
    </div>
  );
}
