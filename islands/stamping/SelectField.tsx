import { JSX } from "preact";
import { StampRow } from "globals";

interface SelectFieldProps {
  placeholder?: string;
  value: string;
  onChange: (e: JSX.TargetedEvent<HTMLSelectElement, Event>) => void;
  error?: string;
  disabled?: boolean;
  options: StampRow[];
}

export function SelectField({
  placeholder = "",
  value,
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
        className="p-3 bg-[#999999] text-[#333333] placeholder:text-[#333333] font-medium w-full outline-none rounded-md focus:bg-[#CCCCCC]"
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
