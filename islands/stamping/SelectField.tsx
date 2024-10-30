import { JSX } from "preact";

interface SelectFieldProps {
  placeholder?: string;
  value: string;
  onChange: (e: JSX.TargetedEvent<HTMLInputElement, Event>) => void;
  error?: string;
  disabled?: boolean;
}

const options = [
  { value: 1, label: "#123456" },
  { value: 2, label: "#123456" },
  { value: 3, label: "#123456" },
  { value: 4, label: "#123456" },
  { value: 5, label: "#123456" },
  { value: 6, label: "#123456" },
  { value: 7, label: "#123456" },
  { value: 8, label: "#123456" },
  { value: 9, label: "#123456" },
];

export function SelectField({
  placeholder = "",
  value,
  onChange = () => {},
  error,
  disabled = false,
}: SelectFieldProps) {
  return (
    <div class="w-full">
      <select className="p-3 bg-[#999999] text-[#333333] placeholder:text-[#333333] font-medium w-full outline-none rounded-md focus:bg-[#CCCCCC]">
        {options.map((item) => <option value={item.value}>{item.label}
        </option>)}
      </select>
      {error && <p class="text-red-500 mt-2">{error}</p>}
    </div>
  );
}
