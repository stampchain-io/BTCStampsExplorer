import { JSX } from "preact";
import { StampRow } from "$globals";

interface SelectFieldProps {
  _placeholder?: string;
  _value: string;
  onChange: (e: JSX.TargetedEvent<HTMLSelectElement, Event>) => void;
  error?: string;
  disabled?: boolean;
  options: StampRow[];
}

export function SelectField({
  _placeholder = "",
  _value,
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
        className="h-[42px] mobileLg:h-12 px-3 rounded-md bg-stamp-grey text-stamp-grey-darkest placeholder:text-stamp-grey-darkest placeholder:uppercase placeholder:font-light text-sm mobileLg:text-base font-medium w-full outline-none focus:bg-stamp-grey-light"
      >
        {options.length
          ? options.map((item) => (
            <option key={item.tx_hash} value={item.tx_hash}>
              #{item.stamp}
            </option>
          ))
          : <option>No Data</option>}
      </select>
      {error && <p class="text-red-500 mt-2">{error}</p>}
    </div>
  );
}
