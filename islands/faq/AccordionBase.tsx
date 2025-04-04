/* ===== ACCORDION BASE COMPONENT ===== */
import { JSX } from "preact";
import { signal } from "@preact/signals";
import { Icon } from "$icons";
import { text } from "$text";

/* ===== STATE  ===== */
// Create a shared signal outside the component
const activeAccordion = signal<string | null>(null);

/* ===== COMPONENT ===== */
export const Accordion = (
  { title, children }: { title: string; children: JSX.Element },
) => {
  /* ===== ACCORDION STATE ===== */
  const isOpen = activeAccordion.value === title;

  /* ===== EVENT HANDLERS ===== */
  const toggleAccordion = () => {
    activeAccordion.value = isOpen ? null : title;
  };

  return (
    <div className="w-full">
      {/* Accordion Header */}
      <div
        className="flex justify-between items-center cursor-pointer group"
        onClick={toggleAccordion}
      >
        {/* Title with Gradient Styling - cant use headingGreyLDLink styling (gray-gradient1-hover) because of the group hover effect */}
        <h2
          className={`font-bold text-xl tracking-wide gray-gradient1-hover group-hover:[background:none_!important] group-hover:[-webkit-text-fill-color:#CCCCCC_!important] group-hover:[text-fill-color:#CCCCCC_!important] transition-colors duration-500
            ${
            isOpen
              ? "[background:none_!important] [-webkit-text-fill-color:#CCCCCC_!important] [text-fill-color:#CCCCCC_!important] "
              : ""
          }`}
        >
          {title}
        </h2>

        {/* Toggle Icon */}
        <span
          className={`transition-transform duration-300 ${
            isOpen
              ? "fill-stamp-grey-light rotate-45"
              : "fill-stamp-grey-darker group-hover:fill-stamp-grey-light transition-colors duration-100 rotate-0"
          }`}
        >
          <Icon
            type="iconLink"
            name="expand"
            weight="bold"
            size="xsResponsive"
            color="custom"
          />
        </span>
      </div>

      {/* Accordion Content with Animation */}
      <div
        className={` ${
          isOpen ? "max-h-[600px] opacity-100" : "max-h-0 opacity-10"
        } mt-3 overflow-hidden transition-all duration-500`}
      >
        <div
          className={`${text} [&>div>ul]:list-disc [&>div>ul]:list-inside [&>div>ul]:mb-6 [&>div>ul]:flex [&>div>ul]:flex-col [&>div>ul]:gap-1.5 mb-6`}
        >
          {children}
        </div>
      </div>
    </div>
  );
};
