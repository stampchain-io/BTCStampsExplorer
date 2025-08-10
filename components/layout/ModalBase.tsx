import { CloseIcon } from "$icon";
import { closeModal } from "$islands/modal/states.ts";
import { logger } from "$lib/utils/logger.ts";
import { tooltipIcon } from "$notification";
import { titleGreyLD } from "$text";
import type { ModalBaseProps } from "$types/ui.d.ts";
import { useEffect, useRef, useState } from "preact/hooks";

export function ModalBase({
  onClose,
  title,
  children,
  className = "",
  contentClassName = "",
  hideHeader = false,
}: ModalBaseProps) {
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
      message: "Modal closing from ModalBase",
      component: "ModalBase",
    });

    const modalContainer = document.getElementById("animation-modal-container");
    if (modalContainer) {
      modalContainer.classList.add("out");
    }

    setTimeout(() => {
      if (onClose) {
        onClose();
      }
      closeModal();
    }, 600);
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
    <div /* same as glassmorphism, but importing the styles doesn't display properly */
      className={`
        relative w-[340px] min-[420px]:w-[360px] mobileMd:w-[380px]
        p-5 border-[1px] border-stamp-grey-darkest/20 rounded-xl
  bg-gradient-to-br from-stamp-grey-darkest/15 to-stamp-grey-darkest/30
  backdrop-blur overflow-hidden
  shadow-[0_8px_16px_rgba(22,22,22,0.1),inset_0_1px_0_rgba(22,22,22,0.3),inset_0_-1px_0_rgba(22,22,22,0.1),inset_0_0_4px_4px_rgba(22,22,22,0.2)]
        ${className}
      `}
      onClick={(e) => e.stopPropagation()}
    >
      <div class={`relative ${contentClassName}`}>
        {!hideHeader && (
          <>
            <div
              class="absolute top-0 right-0 -mr-1.5 -mt-1.5 ms-auto cursor-pointer"
              onMouseEnter={handleCloseMouseEnter}
              onMouseLeave={handleCloseMouseLeave}
            >
              <CloseIcon
                size="sm"
                weight="bold"
                color="grey"
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

            <div class="w-full text-center">
              <h2 class={`${titleGreyLD} pt-6 pb-9`}>
                {title}
              </h2>
            </div>
          </>
        )}

        {children}
      </div>
    </div>
  );
}

export const handleModalClose = () => {
  logger.debug("ui", {
    message: "Modal closing from ModalBase",
    component: "ModalBase",
  });

  const modalContainer = document.getElementById("animation-modal-container");
  if (modalContainer) {
    modalContainer.classList.add("out");
  }

  setTimeout(() => {
    closeModal();
  }, 600);
};
