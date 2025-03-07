import { useRef, useState } from "preact/hooks";
import { Button } from "$components/shared/Button.tsx";

// Add queryParamsToFilters export
export const queryParamsToFilters = (search: string) => {
  const params = new URLSearchParams(search);
  return {
    buyNow: {
      atomic: params.get("atomic") === "true",
      dispenser: params.get("dispenser") === "true",
    },
    status: {
      locked: params.get("locked") === "true",
      oneOfOne: params.get("oneOfOne") === "true",
    },
    forSale: params.get("forSale") === "true",
    trendingSales: params.get("trendingSales") === "true",
    sold: params.get("sold") === "true",
    fileType: {
      svg: params.get("fileTypeSvg") === "true",
      pixel: params.get("fileTypePixel") === "true",
      gif: params.get("fileTypeGif") === "true",
      jpg: params.get("fileTypeJpg") === "true",
      png: params.get("fileTypePng") === "true",
      webp: params.get("fileTypeWebp") === "true",
      bmp: params.get("fileTypeBmp") === "true",
      jpeg: params.get("fileTypeJpeg") === "true",
      html: params.get("fileTypeHtml") === "true",
      olga: params.get("fileTypeOlga") === "true",
      src721: params.get("fileTypeSrc721") === "true",
      src101: params.get("fileTypeSrc101") === "true",
    },
    stampRangePreset: parseInt(params.get("stampRangePreset") || "10000"),
    stampRange: {
      min: params.get("stampRangeMin") || "",
      max: params.get("stampRangeMax") || "",
    },
    priceRange: {
      min: params.get("stampPriceMin") || "",
      max: params.get("stampPriceMax") || "",
    },
    search: "",
    sortOrder: params.get("sortOrder") || "",
  };
};

// Add queryParamsToServicePayload export
export const queryParamsToServicePayload = (search: string) => {
  const params = new URLSearchParams(search);
  return {
    atomic: params.get("atomic") === "true",
    dispenser: params.get("dispenser") === "true",
    locked: params.get("locked") === "true",
    oneOfOne: params.get("oneOfOne") === "true",
    forSale: params.get("forSale") === "true",
    trendingSales: params.get("trendingSales") === "true",
    sold: params.get("sold") === "true",
    fileTypeSvg: params.get("fileTypeSvg") === "true",
    fileTypePixel: params.get("fileTypePixel") === "true",
    fileTypeGif: params.get("fileTypeGif") === "true",
    fileTypeJpg: params.get("fileTypeJpg") === "true",
    fileTypePng: params.get("fileTypePng") === "true",
    fileTypeWebp: params.get("fileTypeWebp") === "true",
    fileTypeBmp: params.get("fileTypeBmp") === "true",
    fileTypeJpeg: params.get("fileTypeJpeg") === "true",
    fileTypeHtml: params.get("fileTypeHtml") === "true",
    fileTypeOlga: params.get("fileTypeOlga") === "true",
    fileTypeSrc721: params.get("fileTypeSrc721") === "true",
    fileTypeSrc101: params.get("fileTypeSrc101") === "true",
    stampRangePreset: params.get("stampRangePreset"),
    stampRangeMin: params.get("stampRangeMin"),
    stampRangeMax: params.get("stampRangeMax"),
    stampPriceMin: params.get("stampPriceMin"),
    stampPriceMax: params.get("stampPriceMax"),
  };
};

// Add the allQueryKeysFromFilters export
export const allQueryKeysFromFilters = [
  "atomic",
  "dispenser",
  "locked",
  "oneOfOne",
  "forSale",
  "trendingSales",
  "sold",
  "fileTypeSvg",
  "fileTypePixel",
  "fileTypeGif",
  "fileTypeJpg",
  "fileTypePng",
  "fileTypeWebp",
  "fileTypeBmp",
  "fileTypeJpeg",
  "fileTypeHtml",
  "fileTypeOlga",
  "fileTypeSrc721",
  "fileTypeSrc101",
  "stampRangePreset",
  "stampRangeMin",
  "stampRangeMax",
  "stampPriceMin",
  "stampPriceMax",
  "sortOrder",
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

const defaultFilters = {
  buyNow: {
    atomic: false,
    dispenser: false,
  },
  status: {
    locked: false,
    oneOfOne: false,
  },
  forSale: false,
  trendingSales: false,
  sold: false,
  fileType: {
    svg: false,
    pixel: false,
    gif: false,
    jpg: false,
    png: false,
    webp: false,
    bmp: false,
    jpeg: false,
    html: false,
    olga: false,
    src721: false,
    src101: false,
  },
  stampRangePreset: 10000,
  stampRange: {
    min: "",
    max: "",
  },
  priceRange: {
    min: "",
    max: "",
  },
  sortOrder: "",
};

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
        className="flex w-full items-center justify-between px-3 py-3 text-lg mobileLg:text-xl font-light group"
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
        <div className="px-3 pt-1.5 pb-3">
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
        className={`appearance-none relative float-left
         h-4 w-4 mobileLg:h-[18px] mobileLg:w-[18px]  
         rounded-sm border-2 border-solid cursor-pointer
         transition-colors duration-300
         ${
          checked
            ? `bg-stamp-grey-light border-stamp-grey-light ${
              canHover
                ? "group-hover:bg-stamp-grey group-hover:border-stamp-grey"
                : ""
            }`
            : "border-stamp-grey group-hover:border-stamp-grey-light"
        }`}
        type="checkbox"
        checked={checked}
        onChange={handleChange}
      />
      <span
        className={`inline-block ml-[9px] text-sm mobileLg:text-base font-semibold 
        transition-colors duration-300
        ${
          checked
            ? `text-stamp-grey-light ${
              canHover ? "group-hover:text-stamp-grey" : ""
            }`
            : "text-stamp-grey group-hover:text-stamp-grey-light"
        }`}
      >
        {label}
      </span>
    </label>
  );
};

const RangeInput = ({ label, value, onChange }: RangeInputProps) => (
  <div className="flex flex-col space-y-1">
    <label className="text-xs text-stamp-table-text">{label}</label>
    <input
      type="number"
      value={value}
      onChange={(e) => {
        onChange(e.target.value);
      }}
      min="0"
      className="w-full px-2 py-1 border border-purple-300 rounded-md focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
      placeholder="ENTER VALUE"
    />
  </div>
);

function useDebouncedCallback(
  callback: (value: string) => void,
  delay: number,
) {
  const timeoutRef = useRef<number | null>(null);

  return (str: string) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(() => {
      callback(str);
    }, delay);
  };
}

// Add interface for expanded sections
interface ExpandedSections {
  buyNow: boolean;
  editions: boolean;
  fileType: boolean;
  stampRange: boolean;
  priceRange: boolean;
}

const buttonGreyOutline =
  "inline-flex items-center justify-center border-2 border-stamp-grey rounded-md text-sm mobileLg:text-base font-extrabold text-stamp-grey tracking-[0.05em] h-[42px] mobileLg:h-12 px-4 mobileLg:px-5 hover:border-stamp-grey-light hover:text-stamp-grey-light transition-colors";

export const StampFilter = (
  { searchparams, open, setOpen, onFiltersChange }: StampFilterProps,
) => {
  // Parse URL parameters
  const atomic = searchparams.get("buyNow[atomic]") === "true";
  const dispenser = searchparams.get("buyNow[dispenser]") === "true";
  const oneOfOne = searchparams.get("editions[oneOfOne]") === "true";
  const multiple = searchparams.get("editions[multiple]") === "true";
  const locked = searchparams.get("editions[locked]") === "true";
  const unlocked = searchparams.get("editions[unlocked]") === "true";
  const divisible = searchparams.get("editions[divisible]") === "true";
  const forSale = searchparams.get("forSale") === "true";
  const trendingSales = searchparams.get("trendingSales") === "true";
  const sold = searchparams.get("sold") === "true";
  const stampRangePreset = searchparams.get("stampRangePreset");
  const stampRangeMin = searchparams.get("stampRange[min]");
  const stampRangeMax = searchparams.get("stampRange[max]");
  const stampPriceMin = searchparams.get("priceRange[min]");
  const stampPriceMax = searchparams.get("priceRange[max]");
  const fileTypeSvg = searchparams.get("fileType[svg]") === "true";
  const fileTypeGif = searchparams.get("fileType[gif]") === "true";
  const fileTypeJpg = searchparams.get("fileType[jpg]") === "true";
  const fileTypePng = searchparams.get("fileType[png]") === "true";
  const fileTypeWebp = searchparams.get("fileType[webp]") === "true";
  const fileTypeBmp = searchparams.get("fileType[bmp]") === "true";
  const fileTypeJpeg = searchparams.get("fileType[jpeg]") === "true";
  const fileTypeHtml = searchparams.get("fileType[html]") === "true";
  const fileTypeOlga = searchparams.get("fileType[olga]") === "true";
  const fileTypeSrc721 = searchparams.get("fileType[src721]") === "true";
  const fileTypeSrc101 = searchparams.get("fileType[src101]") === "true";

  const initialFilters = {
    buyNow: {
      atomic: atomic || false,
      dispenser: dispenser || false,
    },
    editions: {
      oneOfOne: oneOfOne || false,
      multiple: multiple || false,
      locked: locked || false,
      unlocked: unlocked || false,
      divisible: divisible || false,
    },
    forSale: forSale || false,
    trendingSales: trendingSales || false,
    sold: sold || false,
    fileType: {
      svg: fileTypeSvg || false,
      gif: fileTypeGif || false,
      jpg: fileTypeJpg || false,
      png: fileTypePng || false,
      webp: fileTypeWebp || false,
      bmp: fileTypeBmp || false,
      jpeg: fileTypeJpeg || false,
      html: fileTypeHtml || false,
      olga: fileTypeOlga || false,
      src721: fileTypeSrc721 || false,
      src101: fileTypeSrc101 || false,
    },
    stampRangePreset: stampRangePreset || "",
    stampRange: {
      min: stampRangeMin || "",
      max: stampRangeMax || "",
    },
    priceRange: {
      min: stampPriceMin || "",
      max: stampPriceMax || "",
    },
    sortOrder: "",
  };

  const [filters, setFilters] = useState(initialFilters);
  const [expandedSections, setExpandedSections] = useState<ExpandedSections>({
    buyNow: true,
    editions: false,
    fileType: false,
    stampRange: false,
    priceRange: false,
  });

  const debouncedOnFilterChange = useDebouncedCallback(
    (queryString: string) => {
      const url = new URL(globalThis.location.href);
      url.search = queryString;
      globalThis.history.pushState({}, "", url);
    },
    500,
  );

  const handleFilterChange = (key: string, value: any) => {
    setFilters((prev) => {
      const newFilters = {
        ...prev,
        [key]: value,
      };

      // Update URL with new filters
      const url = new URL(globalThis.location.href);

      // Special handling for objects
      if (typeof value === "object") {
        // Clear existing params for this key
        Array.from(url.searchParams.keys())
          .filter((param) => param.startsWith(`${key}[`))
          .forEach((param) => url.searchParams.delete(param));

        // Set new params
        Object.entries(value).forEach(([subKey, subValue]) => {
          if (subValue) {
            // For buyNow and status, set the subKey directly
            if (key === "buyNow" || key === "status") {
              url.searchParams.set(subKey, String(subValue));
            } else {
              url.searchParams.set(`${key}[${subKey}]`, String(subValue));
            }
          } else {
            // Remove parameter if value is false
            if (key === "buyNow" || key === "status") {
              url.searchParams.delete(subKey);
            } else {
              url.searchParams.delete(`${key}[${subKey}]`);
            }
          }
        });
      } else {
        // Handle non-object values
        if (value) {
          url.searchParams.set(key, String(value));
        } else {
          url.searchParams.delete(key);
        }
      }

      // Update URL and trigger filter count update
      globalThis.history.pushState({}, "", url.toString());
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
    // Reset all filters
    setFilters(initialFilters);

    // Clear URL parameters
    const url = new URL(window.location.href);
    Array.from(url.searchParams.keys()).forEach((key) => {
      url.searchParams.delete(key);
    });
    globalThis.history.pushState({}, "", url.toString());

    // Trigger immediate update of the badge count
    onFiltersChange?.();
  };

  const handleClose = () => {
    setOpen(false);
    onFiltersChange?.();
  };

  return (
    <div
      className={`
        fixed top-0 left-0 z-40 
        w-full mobileMd:w-64 mobileLg:w-72 h-screen 
        p-3 backdrop-blur-md 
        bg-gradient-to-b from-[#000000]/70 to-[#000000]/90 
        overflow-y-auto transition-transform
        ${open ? "translate-x-0" : "-translate-x-full"}
      `}
    >
      {/* Header */}
      <div className="flex flex-col p-3 space-y-3 mb-3 mobileLg:mb-[18px]">
        <div className="flex justify-end">
          <button onClick={handleClose}>
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
          <div className="space-y-1.5">
            <Checkbox
              label="JPEG"
              checked={filters.fileType.jpeg}
              onChange={(checked) =>
                handleFilterChange("fileType", {
                  ...filters.fileType,
                  jpeg: checked,
                })}
            />
            <Checkbox
              label="JPG"
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
              label="BMP"
              checked={filters.fileType.bmp}
              onChange={(checked) =>
                handleFilterChange("fileType", {
                  ...filters.fileType,
                  bmp: checked,
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
              label="SRC-101"
              checked={filters.fileType.src101}
              onChange={(checked) =>
                handleFilterChange("fileType", {
                  ...filters.fileType,
                  src101: checked,
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
          <div className="space-y-1.5">
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

        {/* Stamp Range Section */}
        <FilterSection
          title="STAMP RANGE"
          section="stampRange"
          expanded={expandedSections.stampRange}
          toggle={() => toggleSection("stampRange")}
        >
          <div className="space-y-1.5 mobileLg:space-y-3">
            {/* Preset Ranges */}
            <div className="space-y-1.5">
              {[100, 1000, 5000, 10000].map((value) => (
                <div key={value} className="flex items-center space-x-2">
                  <input
                    type="radio"
                    name="stampRange"
                    value={value}
                    checked={filters.stampRangePreset === value}
                    onChange={() => {
                      handleFilterChange("stampRangePreset", value);
                    }}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <label className="text-sm mobileLg:text-base text-stamp-grey">
                    SUB {value}
                  </label>
                </div>
              ))}
            </div>

            {/* Custom Range */}
            <div className="pt-2 border-t border-stamp-purple-highlight/20">
              <div className="flex items-center gap-2 mb-2 text-stamp-grey-light">
                <span className="text-sm font-medium">Custom Range</span>
              </div>
              <div className="space-y-1.5">
                <RangeInput
                  label="Min Stamp Number"
                  value={filters.stampRange.min}
                  onChange={(value) => {
                    handleFilterChange("stampRange", {
                      ...filters.stampRange,
                      min: value,
                      preset: "",
                    });
                    // Only trigger once for the entire stamp range section
                    if (!filters.stampRange.max) {
                      onFiltersChange?.();
                    }
                  }}
                />
                <RangeInput
                  label="Max Stamp Number"
                  value={filters.stampRange.max}
                  onChange={(value) => {
                    handleFilterChange("stampRange", {
                      ...filters.stampRange,
                      max: value,
                      preset: "",
                    });
                    // Only trigger once for the entire stamp range section
                    if (!filters.stampRange.min) {
                      onFiltersChange?.();
                    }
                  }}
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
          <div className="space-y-1.5">
            <Checkbox
              label="FOR SALE"
              checked={filters.forSale}
              onChange={(checked) => handleFilterChange("forSale", checked)}
            />
            <Checkbox
              label="TRENDING SALES"
              checked={filters.trendingSales}
              onChange={(checked) =>
                handleFilterChange("trendingSales", checked)}
            />
            <Checkbox
              label="SOLD"
              checked={filters.sold}
              onChange={(checked) => handleFilterChange("sold", checked)}
            />
          </div>
        </FilterSection>

        {/* Price Range Section */}
        <FilterSection
          title="PRICE"
          section="priceRange"
          expanded={expandedSections.priceRange}
          toggle={() => toggleSection("priceRange")}
        >
          <div className="space-y-1.5">
            <RangeInput
              label="MIN"
              value={filters.priceRange.min}
              onChange={(value: string) => {
                handleFilterChange("priceRange", {
                  ...filters.priceRange,
                  min: value,
                });
                // Only trigger once for the entire price range section
                if (!filters.priceRange.max) {
                  onFiltersChange?.();
                }
              }}
            />
            <RangeInput
              label="MAX"
              value={filters.priceRange.max}
              onChange={(value: string) => {
                handleFilterChange("priceRange", {
                  ...filters.priceRange,
                  max: value,
                });
                // Only trigger once for the entire price range section
                if (!filters.priceRange.min) {
                  onFiltersChange?.();
                }
              }}
            />
          </div>
        </FilterSection>

        {/* Buy Now Section */}
        {
          /*
        <FilterSection
          title="BUY NOW"
          section="buyNow"
          expanded={expandedSections.buyNow}
          toggle={() => toggleSection("buyNow")}
        >
          <div className="space-y-1.5">
            <Checkbox
              label="ATOMIC"
              checked={filters.buyNow.atomic}
              onChange={(checked) => {
                handleFilterChange("buyNow", {
                  ...filters.buyNow,
                  atomic: checked
                });
              }}
            />
            <Checkbox
              label="DISPENSER"
              checked={filters.buyNow.dispenser}
              onChange={(checked) => {
                handleFilterChange("buyNow", {
                  ...filters.buyNow,
                  dispenser: checked
                });
              }}
            />
          </div>
        </FilterSection>
        */
        }
        {
          /* Sort Order
        <div className="p-3 border-t border-stamp-purple-highlight/20">
          <label className="block text-sm font-medium mb-2 text-stamp-grey">
            SORT BY
          </label>
          <select
            value={filters.sortOrder}
            onChange={(e) => handleFilterChange("sortOrder", e.target.value)}
            className="w-full p-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-stamp-grey"
          >
            <option value="index_desc">STAMP INDEX: HIGH TO LOW</option>
            <option value="index_asc">STAMP INDEX: LOW TO HIGH</option>
            <option value="price_desc">PRICE: HIGH TO LOW</option>
            <option value="price_asc">PRICE: LOW TO HIGH</option>
          </select>
        </div>*/
        }

        {/* Clear Filters Button */}
        <div className="!mt-6">
          <button
            onClick={handleClearFilters}
            className={buttonGreyOutline}
          >
            CLEAR FILTERS
          </button>
        </div>
      </div>
    </div>
  );
};
