import { logger } from "$lib/utils/logger.ts";
import { useEffect } from "preact/hooks";

interface ModalSearchBaseProps {
  children: preact.ComponentChildren;
  onClose?: () => void;
}

export function ModalSearchBase({ children, onClose }: ModalSearchBaseProps) {
  console.log("ModalSearchBase rendered"); // Debug log

  const handleClose = () => {
    logger.debug("ui", {
      message: "Search modal closing from ModalSearchBase",
      component: "ModalSearchBase",
    });

    // First trigger the animation
    const modalContainer = document.getElementById("animation-modal-container");
    if (modalContainer) {
      modalContainer.classList.add("out");
    }

    // Then wait for animation to complete before closing
    setTimeout(() => {
      if (onClose) {
        onClose();
      }
    }, 600);
  };

  // Handle keyboard events
  useEffect(() => {
    const handleKeyboardShortcut = (e: KeyboardEvent) => {
      console.log("Keyboard event in ModalSearchBase:", e.key); // Debug log
      if (e.key === "Escape" || (e.key === "s" && (e.ctrlKey || e.metaKey))) {
        e.preventDefault(); // Prevent default browser save behavior
        handleClose();
      }
    };

    document.addEventListener("keydown", handleKeyboardShortcut);
    return () =>
      document.removeEventListener("keydown", handleKeyboardShortcut);
  }, []);

  return (
    <div
      class="w-[90vw] mobileMd:w-[480px] my-16 mobileLg:my-[76px]"
      onClick={(e) => e.stopPropagation()}
    >
      <div class="relative rounded-md !bg-[#080808] p-[2px] before:absolute before:inset-0 before:rounded-md before:z-[1] before:bg-[conic-gradient(from_var(--angle),#666666,#999999,#CCCCCC,#999999,#666666)] before:[--angle:0deg] before:animate-rotate [&>*]:relative [&>*]:z-[2] [&>*]:rounded-md [&>*]:bg-[#080808]">
        <div class="relative flex flex-col max-h-[90%] overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
