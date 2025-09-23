import { Icon } from "$icon";
import { openSRC20Search } from "$islands/modal/SearchSRC20Modal.tsx";
import { openStampSearch } from "$islands/modal/SearchStampModal.tsx";
import { tooltipIcon } from "$notification";
import { useEffect, useRef, useState } from "preact/hooks";

const isSRC20Context = (path: string) =>
  path.startsWith("/src20") ||
  /^\/tool\/src20\/(deploy|mint|transfer)(\/|$)/.test(path);

export function SearchButton() {
  const [isTooltipVisible, setIsTooltipVisible] = useState(false);
  const [allowTooltip, setAllowTooltip] = useState(true);
  const tooltipTimeoutRef = useRef<number | null>(null);

  const openContextualSearch = () => {
    const path = globalThis?.location?.pathname ?? "/";
    if (isSRC20Context(path)) {
      openSRC20Search();
    } else {
      openStampSearch();
    }
    setIsTooltipVisible(false);
    setAllowTooltip(false);
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "s") {
        e.preventDefault();
        openContextualSearch();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  useEffect(() => {
    return () => {
      if (tooltipTimeoutRef.current) {
        globalThis.clearTimeout(tooltipTimeoutRef.current);
      }
    };
  }, []);

  const handleMouseEnter = () => {
    if (allowTooltip) {
      if (tooltipTimeoutRef.current) {
        globalThis.clearTimeout(tooltipTimeoutRef.current);
      }
      tooltipTimeoutRef.current = globalThis.setTimeout(() => {
        setIsTooltipVisible(true);
      }, 1500);
    }
  };

  const handleMouseLeave = () => {
    if (tooltipTimeoutRef.current) {
      globalThis.clearTimeout(tooltipTimeoutRef.current);
    }
    setIsTooltipVisible(false);
    setAllowTooltip(true);
  };

  return (
    <div class="relative">
      <Icon
        type="iconButton"
        name="search"
        weight="bold"
        size="smR"
        color="purple"
        className="mt-1"
        onClick={openContextualSearch}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        role="button"
        aria-label="Search"
      />
      <div
        className={`${tooltipIcon} ${
          isTooltipVisible ? "opacity-100" : "opacity-0"
        }`}
      >
        SEARCH
      </div>
    </div>
  );
}
