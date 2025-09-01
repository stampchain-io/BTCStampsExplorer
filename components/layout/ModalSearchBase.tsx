import { logger } from "$lib/utils/logger.ts";
import type { ModalSearchBaseProps } from "$types/ui.d.ts";
import { useEffect } from "preact/hooks";

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
      <div class="relative rounded-xl !bg-[#0a070a] p-[1px] before:absolute before:inset-0 before:rounded-xl before:z-[1] before:bg-[conic-gradient(from_var(--angle),#666666,#999999,#CCCCCC,#999999,#666666)] before:[--angle:0deg] before:animate-rotate [&>*]:relative [&>*]:z-[2] [&>*]:rounded-xl [&>*]:bg-[#0a070a]">
        <div class="relative flex flex-col max-h-[90%] overflow-hidden">
          {children}
        </div>
      </div>
    </div>
  );
}
