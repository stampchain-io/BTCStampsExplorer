/* TODO (@baba) - move to forms - integrate into styles */
import { useEffect, useRef } from "preact/hooks";
import flatpickr from "flatpickr";

interface PropTypes {
  setDateRange: (date: Date[]) => void;
}

const DatePicker = ({ setDateRange }: PropTypes) => {
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
      className="h-10 px-3 rounded-md bg-stamp-grey text-stamp-grey-darkest placeholder:text-stamp-grey-darkest placeholder:uppercase placeholder:font-light text-sm mobileLg:text-base font-medium w-full outline-none focus:bg-stamp-grey-light"
      ref={calendarRef}
    />
  );
};

export default DatePicker;
