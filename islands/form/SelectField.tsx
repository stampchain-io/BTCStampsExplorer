import { JSX } from "preact";
import type { SelectFieldProps } from "$types/ui.d.ts";
import type { StampRow } from "$types/stamp.d.ts";
import { inputField } from "$form";

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
              class="font-light uppercase"
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
