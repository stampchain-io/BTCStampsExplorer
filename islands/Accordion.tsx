import { useState } from "preact/hooks";
import { JSX } from "preact";

const Accordion = (
  { title, children }: { title: string; children: JSX.Element },
) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleAccordion = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div className="w-full text-stamp-grey-light">
      <div
        className="flex justify-between items-center cursor-pointer group"
        onClick={toggleAccordion}
      >
        <h2
          className={`text-xl mobileLg:text-2xl font-black gray-gradient1-hover group-hover:[background:none_!important] group-hover:[-webkit-text-fill-color:#CCCCCC_!important] group-hover:[text-fill-color:#CCCCCC_!important]
            ${
            isOpen
              ? "[background:none_!important] [-webkit-text-fill-color:#CCCCCC_!important] [text-fill-color:#CCCCCC_!important]"
              : ""
          }`}
        >
          {title}
        </h2>
        <span
          className={`text-2xl mobileLg:text-3xl text-stamp-grey-darker group-hover:text-stamp-grey-light transform transition-transform ${
            isOpen ? "text-stamp-grey-light rotate-45" : ""
          }`}
        >
          +
        </span>
      </div>
      <div
        className={`${
          isOpen ? "max-h-[600px]" : "max-h-0"
        } transition-all duration-500 text-sm tablet:text-lg font-medium overflow-hidden mt-3`}
      >
        {children}
      </div>
    </div>
  );
};

export default Accordion;
