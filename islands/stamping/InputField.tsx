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
        class="h-12 px-3 rounded-md bg-[#999999] text-[#333333] placeholder:text-[#333333] placeholder:uppercase placeholder:font-light text-sm mobileLg:text-base font-medium w-full outline-none focus:bg-[#CCCCCC]"
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
