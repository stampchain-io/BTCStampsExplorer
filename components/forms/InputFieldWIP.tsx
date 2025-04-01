// WIP
// COPY OF SRC20InputField.tsx
// CANNOT PROPERLY TEST IF IT WORKS WITH COMPONENTS OR IF THE CODE IS CORRECT
// DUE TO MY LOCALHOST NOT BEING UP TO DATE WITH THE DB SERVER
// NOT IN USE ATM
// FORM INPUT FIELDS STILL USE THE ORIGINAL FILES

import { Ref } from "preact";
import { inputField } from "$forms";

// Generic interface that works for both islands and regular components
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
