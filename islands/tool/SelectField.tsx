import { JSX } from "preact";
import { StampRow } from "$globals";
import { inputField } from "$forms";

interface SelectFieldProps {
  onChange: (e: JSX.TargetedEvent<HTMLSelectElement, Event>) => void;
  error?: string;
  disabled?: boolean;
  options: StampRow[];
}

export function SelectField({
  onChange,
  error,
  disabled = false,
  options,
}: SelectFieldProps) {
  return (
    <div class="w-full">
      <select
        onChange={onChange}
        disabled={disabled}
        class={inputField}
      >
        {options.length
          ? options.map((item) => (
            <option
              key={item.tx_hash}
              value={item.tx_hash}
              className="font-light uppercase"
            >
              #{item.stamp}
            </option>
          ))
          : <option className="font-light uppercase">NO STAMPS</option>}
      </select>
      {error && <p class="text-red-500 mt-2">{error}</p>}
    </div>
  );
}
