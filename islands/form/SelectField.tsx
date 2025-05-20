import { JSX } from "preact";
import { StampRow } from "$globals";
import { inputField } from "$form";

interface SelectFieldProps {
  onChange: (e: JSX.TargetedEvent<HTMLSelectElement, Event>) => void;
  onClick?: (e: JSX.TargetedEvent<HTMLSelectElement, Event>) => void;
  error?: string;
  disabled?: boolean;
  options: StampRow[];
  value?: string | number | null;
  placeholder?: string;
  className?: string;
}

export function SelectField({
  onChange,
  onClick,
  error,
  disabled = false,
  options,
  value,
  placeholder,
  className,
}: SelectFieldProps) {
  return (
    <div class={`w-full ${className || ""}`}>
      <select
        onChange={onChange}
        onClick={onClick}
        disabled={disabled}
        class={inputField}
        value={value?.toString() ?? ""}
      >
        {placeholder && (
          <option value="" disabled={options.length > 0}>{placeholder}</option>
        )}

        {options.length > 0
          ? options.map((item) => (
            <option
              key={item.tx_hash || item.cpid || item.stamp?.toString()}
              value={item.stamp?.toString()}
              className="font-light uppercase"
            >
              #{item.stamp}
            </option>
          ))
          : !placeholder && <option value="" disabled>NO STAMPS</option>}
      </select>
      {error && <p class="text-red-500 mt-2 text-xs">{error}</p>}
    </div>
  );
}
