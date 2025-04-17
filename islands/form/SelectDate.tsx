import { useEffect, useRef } from "preact/hooks";
import flatpickr from "flatpickr";
import { inputField } from "$form";

interface PropTypes {
  setDateRange: (date: Date[]) => void;
  isUppercase?: boolean;
}

const SelectDate = ({ setDateRange, isUppercase = true }: PropTypes) => {
  const calendarRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (calendarRef.current) {
      flatpickr(calendarRef.current, {
        mode: "range",
        dateFormat: "Y-m-d",
        onChange: (selectedDates) => {
          setDateRange(selectedDates);
        },
      });
    }
  }, []);

  return (
    <input
      className={`${inputField} ${isUppercase ? "uppercase" : ""}`}
      placeholder="SELECT DATE"
      ref={calendarRef}
    />
  );
};

export default SelectDate;
