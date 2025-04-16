/*@baba-rename to ModalBase */
import { useEffect, useRef, useState } from "preact/hooks";
import { logger } from "$lib/utils/logger.ts";
import { tooltipIcon } from "$notification";
import { closeModal } from "$islands/modal/states.ts";
import { CloseIcon } from "$icon";

interface ModalLayoutProps {
  onClose?: () => void;
  title: string;
  children: preact.ComponentChildren;
  className?: string;
  contentClassName?: string;
}

export function ModalLayout({
  onClose,
  title,
  children,
  className = "",
  contentClassName = "",
}: ModalLayoutProps) {
  const [isCloseTooltipVisible, setIsCloseTooltipVisible] = useState(false);
  const [allowCloseTooltip, setAllowCloseTooltip] = useState(true);
  const [closeTooltipText, setCloseTooltipText] = useState("CLOSE");
  const closeTooltipTimeoutRef = useRef<number | null>(null);

  const handleCloseMouseEnter = () => {
    if (allowCloseTooltip) {
      setCloseTooltipText("CLOSE");

      if (closeTooltipTimeoutRef.current) {
        globalThis.clearTimeout(closeTooltipTimeoutRef.current);
      }

      closeTooltipTimeoutRef.current = globalThis.setTimeout(() => {
        setIsCloseTooltipVisible(true);
      }, 1500);
    }
  };

  const handleCloseMouseLeave = () => {
    if (closeTooltipTimeoutRef.current) {
      globalThis.clearTimeout(closeTooltipTimeoutRef.current);
    }
    setIsCloseTooltipVisible(false);
    setAllowCloseTooltip(true);
  };

  const handleClose = () => {
    logger.debug("ui", {
      message: "Modal closing from ModalLayout",
      component: "ModalLayout",
    });

    // First trigger the animation by setting status to true in ModalOverlay
    const modalContainer = document.getElementById("animation-modal-container");
    if (modalContainer) {
      modalContainer.classList.add("out");
    }

    // Then wait for animation to complete before closing
    setTimeout(() => {
      if (onClose) {
        onClose();
      }
      closeModal();
    }, 600); // matches --animation-cleanup-delay from modal.css
  };

  useEffect(() => {
    const handleKeyboardShortcut = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        handleClose();
      }
    };

    document.addEventListener("keydown", handleKeyboardShortcut);
    return () =>
      document.removeEventListener("keydown", handleKeyboardShortcut);
  }, [onClose]);

  useEffect(() => {
    return () => {
      if (closeTooltipTimeoutRef.current) {
        globalThis.clearTimeout(closeTooltipTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      className={`
        relative 
        w-[360px] mobileLg:w-[420px] 
        p-6 rounded-lg 
        dark-gradient-modal
        ${className}
      `}
      onClick={(e) => e.stopPropagation()}
    >
      <div class={`relative ${contentClassName}`}>
        <div
          class="absolute top-0 right-0 -mr-1.5 -mt-1.5 ms-auto cursor-pointer"
          onMouseEnter={handleCloseMouseEnter}
          onMouseLeave={handleCloseMouseLeave}
        >
          <CloseIcon
            size="sm"
            weight="bold"
            color="purpleGradient"
            onClick={() => handleClose()}
          />
          <div
            class={`${tooltipIcon} ${
              isCloseTooltipVisible ? "opacity-100" : "opacity-0"
            }`}
          >
            {closeTooltipText}
          </div>
        </div>

        <p class="font-black text-4xl mobileMd:text-center purple-gradient3 pt-6 pb-12">
          {title}
        </p>

        {children}
      </div>
    </div>
  );
}
