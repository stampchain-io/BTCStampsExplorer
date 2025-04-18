// islands/modal/ModalOverlay.tsx
import { useEffect, useRef, useState } from "preact/hooks";
import { ModalAnimation } from "$islands/modal/states.ts";

interface ModalOverlayProps {
  handleClose: () => void;
  children: preact.ComponentChildren;
  animation?: ModalAnimation;
}

export default function ModalOverlay({
  handleClose,
  children,
  animation = "scaleUpDown", // default animation
}: ModalOverlayProps) {
  const [status, setStatus] = useState<boolean>(false);
  const focusTrapRef = useRef<HTMLDivElement>(null);

  // Debug logging for development
  console.log("ModalOverlay rendering with:", {
    hasChildren: !!children,
    animation,
    status,
  });

  const handleModalClose = () => {
    setStatus(true);
    focusTrapRef.current?.focus();
    setTimeout(() => {
      handleClose();
    }, 500); // Animation duration
  };

  // Keyboard event handling
  useEffect(() => {
    const handleKeyboardShortcut = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleModalClose();
      }
    };

    document.addEventListener("keydown", handleKeyboardShortcut);
    return () =>
      document.removeEventListener("keydown", handleKeyboardShortcut);
  }, [handleClose]);

  return (
    <>
      {/* Focus trap element */}
      <div
        ref={focusTrapRef}
        tabIndex={-1}
        style={{ position: "fixed", opacity: 0, pointerEvents: "none" }}
        aria-hidden="true"
      />

      {/* Modal container */}
      <div
        class={`${animation} ${status ? "out" : ""}`}
        id="animation-modal-container"
        onClick={handleModalClose}
      >
        <div class="animation-modal-background">
          <div class="animation-modal">
            {/* Debug wrapper from component version */}
            <div data-debug="modal-content">
              {children}
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
