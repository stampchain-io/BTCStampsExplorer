import { inputField } from "$form";

interface SRC20InputFieldProps {
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

export function SRC20InputField({
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
}: SRC20InputFieldProps) {
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
      />
      {error && <div class="text-red-500 text-xs mt-1">{error}</div>}
    </div>
  );
}
