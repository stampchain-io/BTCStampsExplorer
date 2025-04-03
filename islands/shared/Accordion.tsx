/* ===== SHARED ACCORDION COMPONENT ===== */
import { JSX } from "preact";
import { signal } from "@preact/signals";
import { text } from "$text";

/* ===== SHARED STATE MANAGEMENT ===== */
// Create a shared signal outside the component
const activeAccordion = signal<string | null>(null);

/* ===== ACCORDION COMPONENT IMPLEMENTATION ===== */
export const Accordion = (
  { title, children }: { title: string; children: JSX.Element },
) => {
  /* ===== ACCORDION STATE ===== */
  const isOpen = activeAccordion.value === title;

  /* ===== EVENT HANDLERS ===== */
  const toggleAccordion = () => {
    activeAccordion.value = isOpen ? null : title;
  };

  /* ===== COMPONENT RENDER ===== */
  return (
    <div className="w-full">
      {/* Accordion Header */}
      <div
        className="flex justify-between items-center cursor-pointer group"
        onClick={toggleAccordion}
      >
        {/* Title with Dynamic Styling */}
        <h2
          className={`font-black text-xl gray-gradient1-hover group-hover:[background:none_!important] group-hover:[-webkit-text-fill-color:#CCCCCC_!important] group-hover:[text-fill-color:#CCCCCC_!important] transition-colors duration-300
            ${
            isOpen
              ? "[background:none_!important] [-webkit-text-fill-color:#CCCCCC_!important] [text-fill-color:#CCCCCC_!important]"
              : ""
          }`}
        >
          {title}
        </h2>

        {/* Toggle Icon */}
        <span
          className={`text-2xl text-stamp-grey-darker group-hover:text-stamp-grey-light transition-all duration-300 ${
            isOpen ? "text-stamp-grey-light rotate-45" : ""
          }`}
        >
          +
        </span>
      </div>

      {/* Accordion Content with Animation */}
      <div
        className={` ${
          isOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-10"
        } mt-3 overflow-hidden transition-all duration-500`}
      >
        <div className="font-normal text-4xl text-stamp-grey-light">
          {children}
        </div>
      </div>
    </div>
  );
};
