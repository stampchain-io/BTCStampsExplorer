import { JSX } from "preact";

interface InputFieldProps {
  type: string;
  placeholder?: string;
  value: string;
  onChange?: (e: JSX.TargetedEvent<HTMLInputElement, Event>) => void;
  onInput?: (e: JSX.TargetedEvent<HTMLInputElement, Event>) => void;
  error?: string;
  inputMode?: "text" | "numeric";
  pattern?: string;
  maxLength?: number;
  disabled?: boolean;
  textAlign?: "left" | "center" | "right";
  isUppercase?: boolean;
}

export function InputField({
  type,
  placeholder,
  value,
  onChange,
  onInput,
  error,
  inputMode,
  pattern,
  maxLength,
  disabled = false,
  textAlign = "left",
  isUppercase = false,
  class: extraClass = "",
}: InputFieldProps) {
  return (
    <div class="w-full">
      <input
        type={type}
        class={`h-12 px-3 rounded-md bg-stamp-grey text-stamp-grey-darkest placeholder:text-stamp-grey-darkest placeholder:uppercase placeholder:font-light text-sm mobileLg:text-base font-medium w-full outline-none focus:bg-stamp-grey-light ${
          textAlign === "center" ? "text-center" : ""
        } ${isUppercase ? "uppercase" : ""} ${extraClass}`}
        placeholder={placeholder}
        value={isUppercase ? value?.toUpperCase() : value}
        onChange={onChange}
        onInput={onInput}
        inputMode={inputMode}
        pattern={pattern}
        maxLength={maxLength}
        disabled={disabled}
        style={{ textAlign }}
      />
      {error && <p class="text-red-500 mt-2">{error}</p>}
    </div>
  );
}
