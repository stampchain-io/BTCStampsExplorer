import { JSX } from "preact";

interface InputFieldProps {
  type: string;
  placeholder?: string;
  value: string;
  onChange: (e: JSX.TargetedEvent<HTMLInputElement, Event>) => void;
  error?: string;
  inputMode?: "text" | "numeric";
  pattern?: string;
  maxLength?: number;
  disabled?: boolean;
}

export function InputField({
  type,
  placeholder,
  value,
  onChange,
  error,
  inputMode,
  pattern,
  maxLength,
  disabled = false,
}: InputFieldProps) {
  return (
    <div class="w-full">
      <input
        type={type}
        class="p-3 bg-[#999999] text-[#333333] placeholder:text-[#333333] font-medium w-full outline-none rounded-md focus:bg-[#CCCCCC]"
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        inputMode={inputMode}
        pattern={pattern}
        maxLength={maxLength}
        disabled={disabled}
      />
      {error && <p class="text-red-500 mt-2">{error}</p>}
    </div>
  );
}
