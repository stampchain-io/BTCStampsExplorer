/* ===== TOGGLE SWITCH BUTTON COMPONENT ===== */
import { toggleButton, toggleKnob, toggleKnobBackground } from "$button";
import { toggleSymbol } from "$text";
import { JSX } from "preact";
import { useEffect, useRef } from "preact/hooks";

/* ===== TYPES ===== */
interface ToggleSwitchButtonProps {
  isActive: boolean;
  onToggle: () => void;
  toggleButtonId: string;
  className?: string;

  // Custom symbols for the toggle states
  activeSymbol?: string;
  inactiveSymbol?: string;

  // Event handlers for external tooltip control
  onMouseEnter?: (e: MouseEvent) => void;
  onMouseLeave?: (e: MouseEvent) => void;

  // Optional click handler
  onClick?: (e: MouseEvent) => void;

  // Optional ref forwarding
  buttonRef?: preact.RefObject<HTMLButtonElement>;
}

/* ===== COMPONENT ===== */
export function ToggleSwitchButton({
  isActive,
  onToggle,
  toggleButtonId,
  className = "",
  activeSymbol,
  inactiveSymbol,
  onMouseEnter,
  onMouseLeave,
  onClick,
  buttonRef,
}: ToggleSwitchButtonProps): JSX.Element {
  /* ===== REFS ===== */
  const handleRef = useRef<HTMLDivElement>(null);
  const internalRef = useRef<HTMLButtonElement>(null);
  const actualRef = buttonRef || internalRef;

  /* ===== EVENT HANDLERS ===== */
  const handleClick = (e: MouseEvent) => {
    if (onClick) {
      onClick(e);
    }
    onToggle();
  };

  /* ===== INITIAL HANDLE APPEARANCE EFFECT ===== */
  useEffect(() => {
    const handleElement = handleRef.current;
    if (handleElement) {
      // Create inner content
      const innerDiv = document.createElement("div");
      innerDiv.className = `${toggleKnob} ${
        isActive ? "bg-stamp-grey-light/50" : "bg-stamp-grey/50"
      } flex items-center justify-center ${toggleSymbol}`;

      // Add symbol if provided
      if (isActive && activeSymbol) {
        const symbolSpan = document.createElement("span");
        symbolSpan.className = "transform -skew-x-[11deg]";
        symbolSpan.textContent = activeSymbol;
        innerDiv.appendChild(symbolSpan);
      } else if (!isActive && inactiveSymbol) {
        const symbolSpan = document.createElement("span");
        symbolSpan.textContent = inactiveSymbol;
        innerDiv.appendChild(symbolSpan);
      }

      // Clear and append
      handleElement.innerHTML = "";
      handleElement.appendChild(innerDiv);

      // Add/remove class
      if (isActive) {
        handleElement.classList.add("translate-x-full");
      } else {
        handleElement.classList.remove("translate-x-full");
      }
    }
  }, []);

  /* ===== HANDLE STATE CHANGE EFFECT ===== */
  useEffect(() => {
    const handleElement = handleRef.current;
    if (handleElement) {
      if (isActive) {
        // Move handle to active position
        handleElement.classList.add("translate-x-full");
        setTimeout(() => {
          // Update inner content with active color and symbol
          const innerDiv = document.createElement("div");
          innerDiv.className =
            `${toggleKnob} bg-stamp-grey-light/50 flex items-center justify-center ${toggleSymbol}`;

          if (activeSymbol) {
            const symbolSpan = document.createElement("span");
            symbolSpan.className = "transform -skew-x-[11deg]";
            symbolSpan.textContent = activeSymbol;
            innerDiv.appendChild(symbolSpan);
          }

          // Clear and append
          handleElement.innerHTML = "";
          handleElement.appendChild(innerDiv);
        }, 150);
      } else {
        // Move handle to inactive position
        handleElement.classList.remove("translate-x-full");
        setTimeout(() => {
          // Update inner content with inactive color and symbol
          const innerDiv = document.createElement("div");
          innerDiv.className =
            `${toggleKnob} bg-stamp-grey/50 flex items-center justify-center ${toggleSymbol}`;

          if (inactiveSymbol) {
            const symbolSpan = document.createElement("span");
            symbolSpan.textContent = inactiveSymbol;
            innerDiv.appendChild(symbolSpan);
          }

          // Clear and append
          handleElement.innerHTML = "";
          handleElement.appendChild(innerDiv);
        }, 150);
      }
    }
  }, [isActive, activeSymbol, inactiveSymbol]);

  /* ===== COMPONENT RENDER ===== */
  return (
    <button
      type="button"
      ref={actualRef}
      class={`${toggleButton} ${className}`}
      onClick={handleClick}
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      <div
        id={toggleButtonId}
        ref={handleRef}
        class={toggleKnobBackground}
      />
    </button>
  );
}
