/* ===== TOGGLE SWITCH BUTTON COMPONENT ===== */
import { JSX } from "preact";
import { useEffect, useRef } from "preact/hooks";
import { toggleButton, toggleKnob, toggleKnobBackground } from "$button";

/* ===== TYPES ===== */
interface ToggleSwitchButtonProps {
  isActive: boolean;
  onToggle: () => void;
  toggleButtonId: string;
  className?: string;

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
        isActive ? "bg-stamp-purple-dark" : "bg-stamp-purple-darker"
      }`;

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
          // Update inner content with active color
          const innerDiv = document.createElement("div");
          innerDiv.className = `${toggleKnob} bg-stamp-purple-dark`;

          // Clear and append
          handleElement.innerHTML = "";
          handleElement.appendChild(innerDiv);
        }, 150);
      } else {
        // Move handle to inactive position
        handleElement.classList.remove("translate-x-full");
        setTimeout(() => {
          // Update inner content with inactive color
          const innerDiv = document.createElement("div");
          innerDiv.className = `${toggleKnob} bg-stamp-purple-darker`;

          // Clear and append
          handleElement.innerHTML = "";
          handleElement.appendChild(innerDiv);
        }, 150);
      }
    }
  }, [isActive]);

  /* ===== COMPONENT RENDER ===== */
  return (
    <button
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
