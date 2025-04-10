import { useEffect, useRef } from "preact/hooks";
import flatpickr from "flatpickr";
import { inputField } from "$form";
interface PropTypes {
  setDateRange: (date: Date[]) => void;
}

const SelectDate = ({ setDateRange }: PropTypes) => {
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
      className={inputField}
      ref={calendarRef}
    />
  );
};

export default SelectDate;
