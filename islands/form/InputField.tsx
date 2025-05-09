import { JSX } from "preact";
import { inputField } from "$form";
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
  minLength?: number;
  disabled?: boolean;
  textAlign?: "left" | "center" | "right";
  isUppercase?: boolean;
  class?: string;
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
  minLength,
  disabled = false,
  textAlign = "left",
  isUppercase = false,
  class: extraClass = "",
}: InputFieldProps) {
  return (
    <div class="w-full">
      <input
        type={type}
        class={`${inputField} ${textAlign === "center" ? "text-center" : ""} ${
          isUppercase ? "uppercase" : ""
        } ${extraClass}`}
        placeholder={placeholder}
        value={isUppercase ? value?.toUpperCase() : value}
        onChange={onChange}
        onInput={onInput}
        inputMode={inputMode}
        pattern={pattern}
        maxLength={maxLength}
        minLength={minLength}
        disabled={disabled}
        style={{ textAlign }}
      />
      {error && <p class="text-red-500 mt-2">{error}</p>}
    </div>
  );
}
