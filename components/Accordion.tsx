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
    <div className="w-full">
      <div className="">
        <div
          className="flex justify-between items-center cursor-pointer"
          onClick={toggleAccordion}
        >
          <h2 className={"text-2xl md:text-5xl font-extralight"}>
            {title}
          </h2>
          <span
            className={`text-2xl md:text-5xl transform transition-transform ${
              isOpen ? "rotate-45" : ""
            }`}
          >
            +
          </span>
        </div>
        <div
          className={`${
            isOpen ? "max-h-[300px]" : "max-h-0"
          } transition-all duration-500 text-sm md:text-lg font-medium overflow-hidden mt-3`}
        >
          {children}
        </div>
      </div>
    </div>
  );
};

export default Accordion;
