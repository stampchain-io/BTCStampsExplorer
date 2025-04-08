import { useEffect, useRef, useState } from "preact/hooks";
import { logger } from "$lib/utils/logger.ts";

interface ModalLayoutProps {
  onClose: () => void;
  title: string;
  children: preact.ComponentChildren;
  className?: string;
  contentClassName?: string;
}

const modalBgBlur =
  "fixed inset-0 z-90 flex items-center justify-center overflow-hidden bg-[#000000] bg-opacity-70 backdrop-filter backdrop-blur-md";

const tooltipIcon =
  "absolute left-1/2 -translate-x-1/2 bg-[#000000BF] px-2 py-1 rounded-sm bottom-full text-[10px] mobileLg:text-xs text-stamp-grey-light font-normal whitespace-nowrap transition-opacity duration-300";

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

  const handleClose = (e: MouseEvent) => {
    // Only close if clicking the overlay itself, not its children
    if (e.target === e.currentTarget) {
      logger.debug("ui", {
        message: "Modal closing via handleClose",
        component: "ModalLayout",
      });
      onClose();
    }
  };

  useEffect(() => {
    const handleKeyboardShortcut = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleKeyboardShortcut);
    return () =>
      document.removeEventListener("keydown", handleKeyboardShortcut);
  }, [onClose]);

  useEffect(() => {
    logger.debug("ui", {
      message: "ModalLayout mounted",
      component: "ModalLayout",
    });

    return () => {
      logger.debug("ui", {
        message: "ModalLayout unmounting",
        component: "ModalLayout",
      });
      if (closeTooltipTimeoutRef.current) {
        globalThis.clearTimeout(closeTooltipTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div
      class={`${modalBgBlur} ${className}`}
      onClick={handleClose}
    >
      <div class="relative w-[360px] h-fit mobileLg:w-[420px] mobileLg:h-fit p-6 dark-gradient-modal rounded-lg overflow-hidden">
        <div class={`relative ${contentClassName}`}>
          <div
            class="absolute top-0 right-0 -mr-1.5 -mt-1.5 ms-auto cursor-pointer"
            onMouseEnter={handleCloseMouseEnter}
            onMouseLeave={handleCloseMouseLeave}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="24"
              height="24"
              viewBox="0 0 32 32"
              class="w-6 h-6 mobileLg:w-7 mobileLg:h-7 hover:fill-stamp-purple-bright"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              role="button"
              aria-label="Close Modal"
              fill="url(#closeModalGradient)"
            >
              <defs>
                <linearGradient
                  id="closeModalGradient"
                  gradientTransform="rotate(-45)"
                >
                  <stop offset="0%" stop-color="#660099" />
                  <stop offset="50%" stop-color="#8800CC" />
                  <stop offset="100%" stop-color="#AA00FF" />
                </linearGradient>
              </defs>
              <path d="M26.0612 23.9387C26.343 24.2205 26.5013 24.6027 26.5013 25.0012C26.5013 25.3997 26.343 25.7819 26.0612 26.0637C25.7794 26.3455 25.3972 26.5038 24.9987 26.5038C24.6002 26.5038 24.218 26.3455 23.9362 26.0637L15.9999 18.125L8.0612 26.0612C7.7794 26.343 7.39721 26.5013 6.9987 26.5013C6.60018 26.5013 6.21799 26.343 5.9362 26.0612C5.6544 25.7794 5.49609 25.3972 5.49609 24.9987C5.49609 24.6002 5.6544 24.218 5.9362 23.9362L13.8749 16L5.9387 8.06122C5.6569 7.77943 5.49859 7.39724 5.49859 6.99872C5.49859 6.60021 5.6569 6.21802 5.9387 5.93622C6.22049 5.65443 6.60268 5.49612 7.0012 5.49612C7.39971 5.49612 7.7819 5.65443 8.0637 5.93622L15.9999 13.875L23.9387 5.93497C24.2205 5.65318 24.6027 5.49487 25.0012 5.49487C25.3997 5.49487 25.7819 5.65318 26.0637 5.93497C26.3455 6.21677 26.5038 6.59896 26.5038 6.99747C26.5038 7.39599 26.3455 7.77818 26.0637 8.05998L18.1249 16L26.0612 23.9387Z" />
            </svg>
            <div
              class={`${tooltipIcon} ${
                isCloseTooltipVisible ? "opacity-100" : "opacity-0"
              }`}
            >
              {closeTooltipText}
            </div>
          </div>

          <p class="font-black text-4xl mobileLg:text-5xl text-center purple-gradient3 pt-3 mobileLg:pt-6 pb-9 mobileLg:pb-12">
            {title}
          </p>

          {children}
        </div>
      </div>
    </div>
  );
}
