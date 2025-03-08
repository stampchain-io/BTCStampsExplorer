import { useEffect, useRef, useState } from "preact/hooks";
import { Button } from "$components/shared/Button.tsx";

// Add queryParamsToFilters export
export const queryParamsToFilters = (search: string) => {
  const params = new URLSearchParams(search);
  return {
    fileType: {
      jpg: params.get("fileType[jpg]") === "true" ||
        params.get("fileType[jpeg]") === "true",
      png: params.get("fileType[png]") === "true",
      gif: params.get("fileType[gif]") === "true",
      webp: params.get("fileType[webp]") === "true",
      avif: params.get("fileType[avif]") === "true",
      bmp: params.get("fileType[bmp]") === "true",
      mp3: params.get("fileType[mp3]") === "true" ||
        params.get("fileType[mpeg]") === "true",
      svg: params.get("fileType[svg]") === "true",
      html: params.get("fileType[html]") === "true",
      src721: params.get("fileType[src721]") === "true",
      legacy: params.get("fileType[legacy]") === "true",
      olga: params.get("fileType[olga]") === "true",
    },
    editions: {
      oneOfOne: params.get("editions[oneOfOne]") === "true",
      multiple: params.get("editions[multiple]") === "true",
      locked: params.get("editions[locked]") === "true",
      unlocked: params.get("editions[unlocked]") === "true",
      divisible: params.get("editions[divisible]") === "true",
    },
    rarity: {
      stampRange: {
        min: params.get("rarity[stampRange][min]") || "",
        max: params.get("rarity[stampRange][max]") || "",
      },
    },
    market: {
      forSale: params.get("market[forSale]") === "true",
      trendingSales: params.get("market[trendingSales]") === "true",
      sold: params.get("market[sold]") === "true",
      priceRange: {
        min: params.get("market[priceRange][min]") || "",
        max: params.get("market[priceRange][max]") || "",
      },
    },
  };
};

// Add queryParamsToServicePayload export
export const queryParamsToServicePayload = (search: string) => {
  const params = new URLSearchParams(search);
  return {
    fileTypeJpg: params.get("fileType[jpg]") === "true" ||
      params.get("fileType[jpeg]") === "true",
    fileTypePng: params.get("fileType[png]") === "true",
    fileTypeGif: params.get("fileType[gif]") === "true",
    fileTypeWebp: params.get("fileType[webp]") === "true",
    fileTypeAvif: params.get("fileType[avif]") === "true",
    fileTypeBmp: params.get("fileType[bmp]") === "true",
    fileTypeMp3: params.get("fileType[mp3]") === "true" ||
      params.get("fileType[mpeg]") === "true",
    fileTypeSvg: params.get("fileType[svg]") === "true",
    fileTypeHtml: params.get("fileType[html]") === "true",
    fileTypeSrc721: params.get("fileType[src721]") === "true",
    fileTypeLegacy: params.get("fileType[legacy]") === "true",
    fileTypeOlga: params.get("fileType[olga]") === "true",

    editionsOneOfOne: params.get("editions[oneOfOne]") === "true",
    editionsMultiple: params.get("editions[multiple]") === "true",
    editionsLocked: params.get("editions[locked]") === "true",
    editionsUnlocked: params.get("editions[unlocked]") === "true",
    editionsDivisible: params.get("editions[divisible]") === "true",

    rarityStampRangeMin: params.get("rarity[stampRange][min]") || "",
    rarityStampRangeMax: params.get("rarity[stampRange][max]") || "",

    marketForSale: params.get("market[forSale]") === "true",
    marketTrendingSales: params.get("market[trendingSales]") === "true",
    marketSold: params.get("market[sold]") === "true",
    marketPriceMin: params.get("market[priceRange][min]") || "",
    marketPriceMax: params.get("market[priceRange][max]") || "",
  };
};

// Add the allQueryKeysFromFilters export
export const allQueryKeysFromFilters = [
  // File Type
  "fileType[jpg]",
  "fileType[jpeg]",
  "fileType[png]",
  "fileType[gif]",
  "fileType[webp]",
  "fileType[avif]",
  "fileType[bmp]",
  "fileType[mp3]",
  "fileType[mpeg]",
  "fileType[svg]",
  "fileType[html]",
  "fileType[src721]",
  "fileType[legacy]",
  "fileType[olga]",

  // Editions
  "editions[oneOfOne]",
  "editions[multiple]",
  "editions[locked]",
  "editions[unlocked]",
  "editions[divisible]",

  // Rarity
  "rarity[stampRange][min]",
  "rarity[stampRange][max]",

  // Market
  "market[forSale]",
  "market[trendingSales]",
  "market[sold]",
  "market[priceRange][min]",
  "market[priceRange][max]",
];

const Badge = ({
  text,
}: {
  text: string;
}) => {
  return (
    <span
      className={`
        absolute top-0 left-0 
        transform -translate-x-1/2 -translate-y-1/2 
        w-6 h-6
        flex items-center justify-center
        text-xs font-medium 
        text-black 
        bg-stamp-purple 
        group-hover:bg-stamp-purple-bright
        rounded-full
        transition-opacity duration-300 ease-in-out
        ${text === "0" ? "opacity-0" : "opacity-100"}
      `}
    >
      {text}
    </span>
  );
};

interface StampFilterProps {
  searchparams: URLSearchParams;
  open: boolean;
  setOpen: (open: boolean) => void;
  filterCount?: number;
  onFiltersChange?: () => void;
}

const StampFilterButton = (
  { searchparams, open, setOpen, filterCount = 0 }: StampFilterProps,
) => {
  return (
    <div class="relative flex flex-col items-center gap-1 rounded-md h-fit border-stamp-purple-bright text-stamp-purple-bright group">
      {filterCount > 0 && <Badge text={filterCount.toString()} />}
      <Button
        variant="icon"
        onClick={() => setOpen(!open)}
        icon={
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 32 32"
            role="button"
            aria-label="Filter"
          >
            <path d="M29.2863 5.98875C29.0903 5.54581 28.77 5.16931 28.3641 4.90502C27.9582 4.64072 27.4843 4.50002 27 4.5H5C4.51575 4.50005 4.04193 4.64074 3.63611 4.90497C3.2303 5.16921 2.90997 5.54561 2.71403 5.98846C2.51809 6.43131 2.45499 6.92153 2.53238 7.39956C2.60978 7.87759 2.82434 8.32285 3.15 8.68125L3.165 8.69875L11.5 17.5938V27C11.4999 27.4526 11.6227 27.8967 11.8553 28.285C12.0879 28.6733 12.4215 28.9912 12.8206 29.2047C13.2197 29.4182 13.6692 29.5194 14.1213 29.4974C14.5734 29.4755 15.011 29.3312 15.3875 29.08L19.3875 26.4137C19.73 26.1853 20.0107 25.8757 20.2048 25.5127C20.3989 25.1496 20.5003 24.7442 20.5 24.3325V17.5938L28.8338 8.69875L28.8488 8.68125C29.1746 8.32304 29.3894 7.87791 29.4671 7.39993C29.5448 6.92195 29.4819 6.4317 29.2863 5.98875ZM17.9113 15.975C17.6488 16.2519 17.5017 16.6185 17.5 17V24.065L14.5 26.065V17C14.4996 16.6191 14.3544 16.2527 14.0938 15.975L6.15375 7.5H25.8463L17.9113 15.975Z" />
          </svg>
        }
        data-drawer-target="drawer-form"
        data-drawer-show="drawer-form"
        aria-controls="drawer-form"
      />
    </div>
  );
};

export { StampFilterButton };

const ChevronIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 32 32"
    class="w-5 h-5 mobileLg:w-6 mobileLg:h-6"
  >
    <path d="M26.7075 12.7074L16.7075 22.7074C16.6146 22.8004 16.5043 22.8742 16.3829 22.9245C16.2615 22.9748 16.1314 23.0007 16 23.0007C15.8686 23.0007 15.7385 22.9748 15.6171 22.9245C15.4957 22.8742 15.3854 22.8004 15.2925 22.7074L5.29251 12.7074C5.10487 12.5198 4.99945 12.2653 4.99945 11.9999C4.99945 11.7346 5.10487 11.4801 5.29251 11.2924C5.48015 11.1048 5.73464 10.9994 6.00001 10.9994C6.26537 10.9994 6.51987 11.1048 6.70751 11.2924L16 20.5862L25.2925 11.2924C25.3854 11.1995 25.4957 11.1258 25.6171 11.0756C25.7385 11.0253 25.8686 10.9994 26 10.9994C26.1314 10.9994 26.2615 11.0253 26.3829 11.0756C26.5043 11.1258 26.6146 11.1995 26.7075 11.2924C26.8004 11.3854 26.8741 11.4957 26.9244 11.617C26.9747 11.7384 27.0006 11.8686 27.0006 11.9999C27.0006 12.1313 26.9747 12.2614 26.9244 12.3828C26.8741 12.5042 26.8004 12.6145 26.7075 12.7074Z" />
  </svg>
);

const CrossIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    viewBox="0 0 32 32"
    class="w-6 h-6 mobileLg:w-7 mobileLg:h-7 hover:fill-stamp-grey-light"
    role="button"
    aria-label="Close Filter"
    fill="url(#closeFilterGradient)"
  >
    <defs>
      <linearGradient
        id="closeFilterGradient"
        gradientTransform="rotate(-45)"
      >
        <stop offset="0%" stop-color="#666666" />
        <stop offset="50%" stop-color="#999999" />
        <stop offset="100%" stop-color="#CCCCCC" />
      </linearGradient>
    </defs>
    <path d="M26.0612 23.9387C26.343 24.2205 26.5013 24.6027 26.5013 25.0012C26.5013 25.3997 26.343 25.7819 26.0612 26.0637C25.7794 26.3455 25.3972 26.5038 24.9987 26.5038C24.6002 26.5038 24.218 26.3455 23.9362 26.0637L15.9999 18.125L8.0612 26.0612C7.7794 26.343 7.39721 26.5013 6.9987 26.5013C6.60018 26.5013 6.21799 26.343 5.9362 26.0612C5.6544 25.7794 5.49609 25.3972 5.49609 24.9987C5.49609 24.6002 5.6544 24.218 5.9362 23.9362L13.8749 16L5.9387 8.06122C5.6569 7.77943 5.49859 7.39724 5.49859 6.99872C5.49859 6.60021 5.6569 6.21802 5.9387 5.93622C6.22049 5.65443 6.60268 5.49612 7.0012 5.49612C7.39971 5.49612 7.7819 5.65443 8.0637 5.93622L15.9999 13.875L23.9387 5.93497C24.2205 5.65318 24.6027 5.49487 25.0012 5.49487C25.3997 5.49487 25.7819 5.65318 26.0637 5.93497C26.3455 6.21677 26.5038 6.59896 26.5038 6.99747C26.5038 7.39599 26.3455 7.77818 26.0637 8.05998L18.1249 16L26.0612 23.9387Z" />
  </svg>
);

// Add interfaces for component props
interface FilterSectionProps {
  title: string;
  children: preact.ComponentChildren;
  section: string;
  expanded: boolean;
  toggle: () => void;
}

interface CheckboxProps {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

interface RangeInputProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}

// Update component declarations with proper types
const FilterSection = (
  { title, children, section, expanded, toggle }: FilterSectionProps,
) => {
  const [canHover, setCanHover] = useState(true);

  const handleClick = () => {
    setCanHover(false);
    toggle();
  };

  const handleMouseLeave = () => {
    setCanHover(true);
  };

  return (
    <div>
      <button
        onClick={handleClick}
        onMouseLeave={handleMouseLeave}
        className="flex items-center justify-between w-full py-1.5 mobileLg:py-3 text-lg mobileLg:text-xl font-light group"
      >
        <span
          className={`${
            expanded
              ? `text-stamp-grey ${
                canHover ? "group-hover:text-stamp-grey-light" : ""
              }`
              : `text-stamp-grey-light ${
                canHover ? "group-hover:text-stamp-grey" : ""
              }`
          } transition-colors duration-300`}
        >
          {title}
        </span>
        <div
          className={`transform transition-all duration-300 ${
            expanded ? "scale-y-[-1]" : ""
          }`}
        >
          <div
            className={`${
              expanded
                ? `fill-stamp-grey ${
                  canHover ? "group-hover:fill-stamp-grey-light" : ""
                }`
                : `fill-stamp-grey-light ${
                  canHover ? "group-hover:fill-stamp-grey" : ""
                }`
            } transition-colors duration-300`}
          >
            <ChevronIcon />
          </div>
        </div>
      </button>
      <div
        className={`overflow-hidden transition-all duration-300 ${
          expanded ? "max-h-[999px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <div className="pt-1.5 pb-3 pl-0.5">
          {children}
        </div>
      </div>
    </div>
  );
};

const Checkbox = ({ label, checked, onChange }: CheckboxProps) => {
  const [canHover, setCanHover] = useState(true);

  const handleChange = (e: Event) => {
    const isChecked = (e.target as HTMLInputElement).checked;
    setCanHover(false);
    onChange(isChecked);
  };

  const handleMouseLeave = () => {
    setCanHover(true);
  };

  return (
    <label
      className="flex items-center cursor-pointer py-1.5 group select-none"
      onMouseLeave={handleMouseLeave}
    >
      <input
        className={`
          appearance-none relative
          w-4 h-4 mobileLg:w-[18px] mobileLg:h-[18px]
          border-2 rounded-sm cursor-pointer
          transition-colors duration-300
          ${
          checked
            ? `border-stamp-grey-light before:bg-stamp-grey-light ${
              canHover
                ? "hover:before:bg-stamp-grey hover:border-stamp-grey"
                : ""
            }`
            : "border-stamp-grey group-hover:border-stamp-grey-light"
        }
          before:content-['']
          before:block
          before:w-1.5 before:h-1.5 mobileLg:before:w-2 mobileLg:before:h-2
          before:rounded-[1px]
          before:absolute
          before:top-1/2 before:left-1/2
          before:-translate-x-1/2 before:-translate-y-1/2
          before:bg-stamp-grey-light
          before:scale-0
          checked:before:scale-100
          before:transition-transform
          before:duration-100
        `}
        type="checkbox"
        checked={checked}
        onChange={handleChange}
      />
      <span
        className={`
          inline-block ml-[9px] text-sm mobileLg:text-base font-semibold 
          transition-colors duration-300
          ${
          checked
            ? `text-stamp-grey-light ${
              canHover ? "group-hover:text-stamp-grey" : ""
            }`
            : "text-stamp-grey group-hover:text-stamp-grey-light"
        }
        `}
      >
        {label}
      </span>
    </label>
  );
};

const RangeInput = (
  { label, value, onChange, placeholder }: RangeInputProps,
) => (
  <div className="flex flex-col space-y-1">
    <label className="text-xs text-stamp-table-text">{label}</label>
    <input
      type="number"
      value={value}
      onKeyDown={(e) => {
        // Prevent e, +, -, E, comma, and diaeresis
        if (["e", "E", "+", "-", ",", "¨"].includes(e.key)) {
          e.preventDefault();
        }
      }}
      onChange={(e) => {
        const value = e.target.value;
        // Only allow digits
        if (/^\d*$/.test(value)) {
          onChange(value);
        }
      }}
      min="0"
      step="1"
      inputMode="numeric"
      pattern="[0-9]*"
      className="h-10 mobileLg:h-11 px-3 rounded-md bg-stamp-grey text-stamp-grey-darkest placeholder:text-stamp-grey-darkest placeholder:uppercase placeholder:font-light text-sm mobileLg:text-base font-medium w-full outline-none focus:bg-stamp-grey-light"
      placeholder={placeholder}
    />
  </div>
);

// Add interface for expanded sections
interface ExpandedSections {
  fileType: boolean;
  editions: boolean;
  rarity: boolean;
  market: boolean;
}

const buttonGreyOutline =
  "inline-flex items-center justify-center border-2 border-stamp-grey rounded-md text-sm mobileLg:text-base font-extrabold text-stamp-grey tracking-[0.05em] h-[42px] mobileLg:h-12 px-4 mobileLg:px-5 hover:border-stamp-grey-light hover:text-stamp-grey-light transition-colors";

const RadioOption = ({ value, isChecked, onChange }: {
  value: number;
  isChecked: boolean;
  onChange: () => void;
}) => {
  const [canHover, setCanHover] = useState(true);

  const handleChange = (e: Event) => {
    const target = e.target as HTMLInputElement;
    setCanHover(false);
    onChange();
  };

  const handleMouseLeave = () => {
    setCanHover(true);
  };

  return (
    <label
      className="flex items-center cursor-pointer py-1.5 group select-none w-full"
      onMouseLeave={handleMouseLeave}
    >
      <input
        type="checkbox"
        checked={isChecked}
        onChange={handleChange}
        className={`
          appearance-none
          w-4 h-4 mobileLg:w-[18px] mobileLg:h-[18px]
          border-2 border-stamp-grey
          rounded-sm
          cursor-pointer
          relative
          transition-colors duration-300
          ${
          isChecked
            ? `border-stamp-grey-light before:bg-stamp-grey-light ${
              canHover
                ? "hover:before:bg-stamp-grey hover:border-stamp-grey"
                : ""
            }`
            : "border-stamp-grey group-hover:border-stamp-grey-light"
        }
          before:content-['']
          before:block
          before:w-1.5 before:h-1.5 mobileLg:before:w-2 mobileLg:before:h-2
          before:rounded-[1px]
          before:absolute
          before:top-1/2 before:left-1/2
          before:-translate-x-1/2 before:-translate-y-1/2
          before:bg-stamp-grey-light
          before:scale-0
          checked:before:scale-100
          before:transition-all
          before:duration-100
        `}
      />
      <span
        className={`
          inline-block ml-[9px] text-sm mobileLg:text-base font-semibold 
          transition-colors duration-300
          ${
          isChecked
            ? `text-stamp-grey-light ${
              canHover ? "group-hover:text-stamp-grey" : ""
            }`
            : "text-stamp-grey group-hover:text-stamp-grey-light"
        }
        `}
      >
        SUB {value}
      </span>
    </label>
  );
};

export const StampFilter = ({
  searchparams,
  open,
  setOpen,
  onFiltersChange,
}: {
  searchparams: URLSearchParams;
  open: boolean;
  setOpen: (open: boolean) => void;
  onFiltersChange?: () => void;
}) => {
  useEffect(() => {
    const handleKeyboardShortcut = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "f") {
        e.preventDefault(); // Prevent default browser find
        if (!open) {
          setOpen(true);
        } else {
          setOpen(false);
        }
      }
      if (e.key === "Escape" && open) {
        setOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyboardShortcut);
    return () =>
      document.removeEventListener("keydown", handleKeyboardShortcut);
  }, [open, setOpen]);

  // Use queryParamsToFilters to get initial filters directly
  const initialFilters = queryParamsToFilters(searchparams.toString());

  const [filters, setFilters] = useState(initialFilters);
  const [expandedSections, setExpandedSections] = useState<ExpandedSections>({
    fileType: false,
    editions: false,
    rarity: false,
    market: false,
  });

  // Add tooltip states
  const [isCloseTooltipVisible, setIsCloseTooltipVisible] = useState(false);
  const [allowCloseTooltip, setAllowCloseTooltip] = useState(true);
  const [closeTooltipText, setCloseTooltipText] = useState("CLOSE");
  const closeTooltipTimeoutRef = useRef<number | null>(null);

  // Cleanup effect for tooltip timeout
  useEffect(() => {
    return () => {
      if (closeTooltipTimeoutRef.current) {
        globalThis.clearTimeout(closeTooltipTimeoutRef.current);
      }
    };
  }, []);

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

  const tooltipIcon =
    "absolute left-1/2 -translate-x-1/2 bg-[#000000BF] px-2 py-1 rounded-sm bottom-full text-[10px] mobileLg:text-xs text-stamp-grey-light font-normal whitespace-nowrap transition-opacity duration-300";

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => {
      const newFilters = {
        ...prev,
        [key]: value,
      };
      const queryString = filtersToQueryParams(
        globalThis.location.search,
        newFilters,
      );
      globalThis.location.href = globalThis.location.pathname + "?" +
        queryString;
      onFiltersChange?.();
      return newFilters;
    });
  };

  const toggleSection = (section: keyof ExpandedSections) => {
    setExpandedSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  const handleClearFilters = () => {
    setFilters(initialFilters);
    const queryString = filtersToQueryParams(
      globalThis.location.search,
      initialFilters,
    );
    globalThis.location.href = globalThis.location.pathname + "?" + queryString;
    onFiltersChange?.();
  };

  const handleClose = () => {
    setOpen(false);
    const queryString = filtersToQueryParams(
      globalThis.location.search,
      filters,
    );
    globalThis.location.href = globalThis.location.pathname + "?" + queryString;
    onFiltersChange?.();
  };

  return (
    <div
      className={`
        fixed top-0 left-0 z-40 
        w-full min-[420px]:w-64 mobileLg:w-72 h-screen 
        p-6 backdrop-blur-md 
        bg-gradient-to-b from-[#000000]/70 to-[#000000]/90 
        overflow-y-auto transition-transform scrollbar-black
        ${open ? "translate-x-0" : "-translate-x-full"}
      `}
    >
      {/* Header */}
      <div className="flex flex-col space-y-3 mb-3 mobileLg:mb-[18px]">
        <div className="flex justify-end">
          <button
            onClick={handleClose}
            onMouseEnter={handleCloseMouseEnter}
            onMouseLeave={handleCloseMouseLeave}
            className="relative top-0 right-0 w-8 h-8 flex items-center justify-center"
          >
            <div
              className={`${tooltipIcon} ${
                isCloseTooltipVisible ? "opacity-100" : "opacity-0"
              }`}
            >
              {closeTooltipText}
            </div>
            <CrossIcon />
          </button>
        </div>
        <div className="flex justify-start">
          <p className="text-2xl mobileLg:text-3xl font-black text-stamp-grey-darker">
            FILTERS
          </p>
        </div>
      </div>

      {/* Filter Sections */}
      <div className="space-y-1.5 mobileLg:space-y-3">
        {/* File Type Section */}
        <FilterSection
          title="FILE TYPE"
          section="fileType"
          expanded={expandedSections.fileType}
          toggle={() => toggleSection("fileType")}
        >
          <div className="space-y-[3px] mobileLg:space-y-1.5">
            <Checkbox
              label="JPG/JPEG"
              checked={filters.fileType.jpg}
              onChange={(checked) =>
                handleFilterChange("fileType", {
                  ...filters.fileType,
                  jpg: checked,
                })}
            />
            <Checkbox
              label="PNG"
              checked={filters.fileType.png}
              onChange={(checked) =>
                handleFilterChange("fileType", {
                  ...filters.fileType,
                  png: checked,
                })}
            />
            <Checkbox
              label="GIF"
              checked={filters.fileType.gif}
              onChange={(checked) =>
                handleFilterChange("fileType", {
                  ...filters.fileType,
                  gif: checked,
                })}
            />
            <Checkbox
              label="WEBP"
              checked={filters.fileType.webp}
              onChange={(checked) =>
                handleFilterChange("fileType", {
                  ...filters.fileType,
                  webp: checked,
                })}
            />
            <Checkbox
              label="AVIF"
              checked={filters.fileType.avif}
              onChange={(checked) =>
                handleFilterChange("fileType", {
                  ...filters.fileType,
                  avif: checked,
                })}
            />
            <Checkbox
              label="BMP"
              checked={filters.fileType.bmp}
              onChange={(checked) =>
                handleFilterChange("fileType", {
                  ...filters.fileType,
                  bmp: checked,
                })}
            />
            <Checkbox
              label="MP3/MPEG"
              checked={filters.fileType.mp3}
              onChange={(checked) =>
                handleFilterChange("fileType", {
                  ...filters.fileType,
                  mp3: checked,
                })}
            />
            <Checkbox
              label="SVG"
              checked={filters.fileType.svg}
              onChange={(checked) =>
                handleFilterChange("fileType", {
                  ...filters.fileType,
                  svg: checked,
                })}
            />
            <Checkbox
              label="HTML"
              checked={filters.fileType.html}
              onChange={(checked) =>
                handleFilterChange("fileType", {
                  ...filters.fileType,
                  html: checked,
                })}
            />
            <Checkbox
              label="SRC-721"
              checked={filters.fileType.src721}
              onChange={(checked) =>
                handleFilterChange("fileType", {
                  ...filters.fileType,
                  src721: checked,
                })}
            />
            <Checkbox
              label="LEGACY"
              checked={filters.fileType.legacy}
              onChange={(checked) =>
                handleFilterChange("fileType", {
                  ...filters.fileType,
                  legacy: checked,
                })}
            />
            <Checkbox
              label="OLGA"
              checked={filters.fileType.olga}
              onChange={(checked) =>
                handleFilterChange("fileType", {
                  ...filters.fileType,
                  olga: checked,
                })}
            />
          </div>
        </FilterSection>

        {/* Editions Section */}
        <FilterSection
          title="EDITIONS"
          section="editions"
          expanded={expandedSections.editions}
          toggle={() => toggleSection("editions")}
        >
          <div className="space-y-[3px] mobileLg:space-y-1.5">
            <Checkbox
              label="1/1"
              checked={filters.editions.oneOfOne}
              onChange={(checked) => {
                handleFilterChange("editions", {
                  ...filters.editions,
                  oneOfOne: checked,
                });
              }}
            />
            <Checkbox
              label="MULTIPLE"
              checked={filters.editions.multiple}
              onChange={(checked) => {
                handleFilterChange("editions", {
                  ...filters.editions,
                  multiple: checked,
                });
              }}
            />
            <Checkbox
              label="LOCKED"
              checked={filters.editions.locked}
              onChange={(checked) => {
                handleFilterChange("editions", {
                  ...filters.editions,
                  locked: checked,
                });
              }}
            />
            <Checkbox
              label="UNLOCKED"
              checked={filters.editions.unlocked}
              onChange={(checked) => {
                handleFilterChange("editions", {
                  ...filters.editions,
                  unlocked: checked,
                });
              }}
            />
            <Checkbox
              label="DIVISIBLE"
              checked={filters.editions.divisible}
              onChange={(checked) => {
                handleFilterChange("editions", {
                  ...filters.editions,
                  divisible: checked,
                });
              }}
            />
          </div>
        </FilterSection>

        {/* Rarity Section */}
        <FilterSection
          title="RARITY"
          section="rarity"
          expanded={expandedSections.rarity}
          toggle={() => toggleSection("rarity")}
        >
          {/* Preset Ranges */}
          <div className="space-y-3">
            <div className="space-y-[3px] mobileLg:space-y-1.5">
              {[100, 1000, 5000, 10000].map((value) => {
                const isChecked =
                  filters.rarity.stampRange.max === String(value);
                return (
                  <RadioOption
                    key={value}
                    value={value}
                    isChecked={isChecked}
                    onChange={() => {
                      if (isChecked) {
                        // Uncheck if already selected
                        handleFilterChange("rarity", {
                          ...filters.rarity,
                          stampRange: {
                            min: filters.rarity.stampRange.min,
                            max: "",
                          },
                        });
                      } else {
                        // Check this one and uncheck others
                        handleFilterChange("rarity", {
                          ...filters.rarity,
                          stampRange: {
                            min: filters.rarity.stampRange.min,
                            max: String(value),
                          },
                        });
                      }
                    }}
                  />
                );
              })}
            </div>

            {/* Custom Stamp Range Inputs */}
            <div>
              <div className="flex items-center mb-[3px]">
                <p className="text-sm text-stamp-grey font-medium">
                  STAMP RANGE
                </p>
              </div>
              <div className="flex gap-6">
                <RangeInput
                  label=""
                  value={filters.rarity.stampRange.min}
                  onChange={(value) =>
                    handleFilterChange("rarity", {
                      ...filters.rarity,
                      stampRange: {
                        ...filters.rarity.stampRange,
                        min: value,
                      },
                    })}
                  placeholder="0"
                />
                <RangeInput
                  label=""
                  value={filters.rarity.stampRange.max}
                  onChange={(value) =>
                    handleFilterChange("rarity", {
                      ...filters.rarity,
                      stampRange: {
                        ...filters.rarity.stampRange,
                        max: value,
                      },
                    })}
                  placeholder="∞"
                />
              </div>
            </div>
          </div>
        </FilterSection>

        {/* Market Section */}
        <FilterSection
          title="MARKET"
          section="market"
          expanded={expandedSections.market}
          toggle={() => toggleSection("market")}
        >
          <div className="space-y-3">
            <div className="space-y-[3px] mobileLg:space-y-1.5">
              {/* Market Checkboxes */}
              <Checkbox
                label="FOR SALE"
                checked={filters.market.forSale}
                onChange={(checked) =>
                  handleFilterChange("market", {
                    ...filters.market,
                    forSale: checked,
                  })}
              />
              <Checkbox
                label="TRENDING SALES"
                checked={filters.market.trendingSales}
                onChange={(checked) =>
                  handleFilterChange("market", {
                    ...filters.market,
                    trendingSales: checked,
                  })}
              />
              <Checkbox
                label="SOLD"
                checked={filters.market.sold}
                onChange={(checked) =>
                  handleFilterChange("market", {
                    ...filters.market,
                    sold: checked,
                  })}
              />
            </div>
            {/* Price Range Inputs */}
            <div>
              <div className="flex items-center mb-[3px]">
                <p className="text-sm text-stamp-grey font-medium">
                  PRICE RANGE
                </p>
              </div>
              <div className="flex gap-6 placeholder:text-xs">
                <RangeInput
                  label=""
                  value={filters.market.priceRange.min}
                  onChange={(value) =>
                    handleFilterChange("market", {
                      ...filters.market,
                      priceRange: {
                        ...filters.market.priceRange,
                        min: value,
                      },
                    })}
                  placeholder="0.000 BTC"
                />
                <RangeInput
                  label=""
                  value={filters.market.priceRange.max}
                  onChange={(value) =>
                    handleFilterChange("market", {
                      ...filters.market,
                      priceRange: {
                        ...filters.market.priceRange,
                        max: value,
                      },
                    })}
                  placeholder="∞ BTC"
                />
              </div>
            </div>
          </div>
        </FilterSection>

        {/* Clear Filters Button */}
        <div className="!mt-6">
          <button
            onClick={handleClearFilters}
            className={`w-full ${buttonGreyOutline}`}
          >
            CLEAR FILTERS
          </button>
        </div>
      </div>
    </div>
  );
};
