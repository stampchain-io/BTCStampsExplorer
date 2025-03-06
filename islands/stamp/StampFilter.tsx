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
      className={`absolute top-0 left-0 transform -translate-x-1/2 -translate-y-1/2 px-1.5 py-[3px] text-xs font-medium text-black bg-stamp-purple-bright rounded-full`}
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
    <div class="relative flex flex-col items-center gap-1 rounded-md h-fit border-stamp-purple-bright text-stamp-purple-bright">
      <Badge text={filterCount.toString()} />
      <Button
        variant="icon"
        onClick={() => setOpen(!open)}
        icon={
          <svg
            viewBox="0 0 32 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M28.825 6.19122C28.6711 5.83561 28.416 5.53309 28.0915 5.32129C27.767 5.10949 27.3875 4.99775 27 4.99997H4.99997C4.61288 5.00073 4.23433 5.11381 3.91025 5.32548C3.58616 5.53715 3.33047 5.83832 3.17418 6.19245C3.01789 6.54658 2.96772 6.93846 3.02977 7.32054C3.09181 7.70262 3.2634 8.05849 3.52372 8.34497L3.53372 8.35622L12 17.3962V27C11.9999 27.3619 12.098 27.7172 12.284 28.0277C12.4699 28.3383 12.7366 28.5926 13.0557 28.7635C13.3748 28.9344 13.7343 29.0155 14.0958 28.9981C14.4574 28.9808 14.8075 28.8656 15.1087 28.665L19.1087 25.9975C19.3829 25.8148 19.6078 25.5673 19.7632 25.2768C19.9187 24.9863 20 24.6619 20 24.3325V17.3962L28.4675 8.35622L28.4775 8.34497C28.7405 8.0598 28.9138 7.70346 28.9756 7.32043C29.0374 6.93741 28.985 6.54466 28.825 6.19122ZM18.2725 16.3225C18.0995 16.5059 18.0021 16.7479 18 17V24.3325L14 27V17C14 16.746 13.9035 16.5016 13.73 16.3162L4.99997 6.99997H27L18.2725 16.3225Z"
              fill="currentColor"
            />
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

const ChevronUp = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
  >
    <path
      d="M26.7075 20.7076C26.6146 20.8005 26.5043 20.8743 26.3829 20.9246C26.2615 20.9749 26.1314 21.0008 26 21.0008C25.8686 21.0008 25.7385 20.9749 25.6171 20.9246C25.4957 20.8743 25.3854 20.8005 25.2925 20.7076L16 11.4138L6.70751 20.7076C6.51987 20.8952 6.26537 21.0006 6.00001 21.0006C5.73464 21.0006 5.48015 20.8952 5.29251 20.7076C5.10487 20.5199 4.99945 20.2654 4.99945 20.0001C4.99945 19.7347 5.10487 19.4802 5.29251 19.2926L15.2925 9.29255C15.3854 9.19958 15.4957 9.12582 15.6171 9.07549C15.7385 9.02517 15.8686 8.99927 16 8.99927C16.1314 8.99927 16.2615 9.02517 16.3829 9.07549C16.5043 9.12582 16.6146 9.19958 16.7075 9.29255L26.7075 19.2926C26.8005 19.3854 26.8742 19.4957 26.9246 19.6171C26.9749 19.7385 27.0008 19.8686 27.0008 20.0001C27.0008 20.1315 26.9749 20.2616 26.9246 20.383C26.8742 20.5044 26.8005 20.6147 26.7075 20.7076Z"
      fill="currentColor"
    />
  </svg>
);

const ChevronDown = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="32"
    height="32"
    viewBox="0 0 32 32"
    fill="none"
  >
    <path
      d="M26.7075 12.7074L16.7075 22.7074C16.6146 22.8004 16.5043 22.8742 16.3829 22.9245C16.2615 22.9748 16.1314 23.0007 16 23.0007C15.8686 23.0007 15.7385 22.9748 15.6171 22.9245C15.4957 22.8742 15.3854 22.8004 15.2925 22.7074L5.29251 12.7074C5.10487 12.5198 4.99945 12.2653 4.99945 11.9999C4.99945 11.7346 5.10487 11.4801 5.29251 11.2924C5.48015 11.1048 5.73464 10.9994 6.00001 10.9994C6.26537 10.9994 6.51987 11.1048 6.70751 11.2924L16 20.5862L25.2925 11.2924C25.3854 11.1995 25.4957 11.1258 25.6171 11.0756C25.7385 11.0253 25.8686 10.9994 26 10.9994C26.1314 10.9994 26.2615 11.0253 26.3829 11.0756C26.5043 11.1258 26.6146 11.1995 26.7075 11.2924C26.8004 11.3854 26.8741 11.4957 26.9244 11.617C26.9747 11.7384 27.0006 11.8686 27.0006 11.9999C27.0006 12.1313 26.9747 12.2614 26.9244 12.3828C26.8741 12.5042 26.8004 12.6145 26.7075 12.7074Z"
      fill="currentColo"
    />
  </svg>
);

const CrossIcon = () => (
  <svg
    class="w-3 h-3"
    aria-hidden="true"
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 14 14"
  >
    <path
      stroke="currentColor"
      stroke-linecap="round"
      stroke-linejoin="round"
      stroke-width="2"
      d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
    />
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
) => (
  <div className="border-b border-stamp-purple-highlight/20 py-4">
    <button
      onClick={toggle}
      className="flex w-full items-center justify-between px-4 py-2 text-lg font-medium text-stamp-table-text"
    >
      {title}
      {expanded ? <ChevronUp /> : <ChevronDown />}
    </button>
    {expanded && (
      <div className="px-4 pt-2">
        {children}
      </div>
    )}
  </div>
);

const Checkbox = ({ label, checked, onChange }: CheckboxProps) => (
  <div className="flex items-center cursor-pointer py-1">
    <input
      className="relative float-left h-[1.125rem] w-[1.125rem] appearance-none rounded-[0.25rem] border-[0.125rem] border-solid border-neutral-300 outline-none before:pointer-events-none before:absolute before:h-[0.875rem] before:w-[0.875rem] before:scale-0 before:rounded-full before:bg-transparent before:opacity-0 before:shadow-[0px_0px_0px_13px_transparent] before:content-[''] checked:border-primary checked:bg-primary checked:before:opacity-[0.16] checked:after:absolute checked:after:-mt-px checked:after:ml-[0.25rem] checked:after:block checked:after:h-[0.8125rem] checked:after:w-[0.375rem] checked:after:rotate-45 checked:after:border-[0.125rem] checked:after:border-l-0 checked:after:border-t-0 checked:after:border-solid checked:after:border-white checked:after:bg-transparent checked:after:content-[''] hover:cursor-pointer hover:before:opacity-[0.04] hover:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:shadow-none focus:transition-[border-color_0.2s] focus:before:scale-100 focus:before:opacity-[0.12] focus:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)] focus:before:transition-[box-shadow_0.2s,transform_0.2s] focus:after:absolute focus:after:z-[1] focus:after:block focus:after:h-[0.875rem] focus:after:w-[0.875rem] focus:after:rounded-[0.125rem] focus:after:content-[''] checked:focus:before:scale-100 checked:focus:before:shadow-[0px_0px_0px_13px_#3b71ca] checked:focus:before:transition-[box-shadow_0.2s,transform_0.2s] checked:hover:before:opacity-[0.04] checked:hover:before:shadow-[0px_0px_0px_13px_rgba(0,0,0,0.6)]"
      type="checkbox"
      checked={checked}
      onChange={(e) => {
        const isChecked = (e.target as HTMLInputElement).checked;
        onChange(isChecked);
      }}
    />
    <label className="inline-block pl-[0.15rem] hover:cursor-pointer text-stamp-grey ml-1 select-none">
      {label}
    </label>
  </div>
);

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
      placeholder="Enter value"
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
  status: boolean;
  fileType: boolean;
  stampRange: boolean;
  priceRange: boolean;
}

export const StampFilter = (
  { searchparams, open, setOpen, onFiltersChange }: StampFilterProps,
) => {
  // Parse URL parameters
  const atomic = searchparams.get("buyNow[atomic]") === "true";
  const dispenser = searchparams.get("buyNow[dispenser]") === "true";
  const locked = searchparams.get("status[locked]") === "true";
  const oneOfOne = searchparams.get("status[oneOfOne]") === "true";
  const forSale = searchparams.get("forSale") === "true";
  const trendingSales = searchparams.get("trendingSales") === "true";
  const sold = searchparams.get("sold") === "true";
  const stampRangePreset = searchparams.get("stampRangePreset");
  const stampRangeMin = searchparams.get("stampRange[min]");
  const stampRangeMax = searchparams.get("stampRange[max]");
  const stampPriceMin = searchparams.get("priceRange[min]");
  const stampPriceMax = searchparams.get("priceRange[max]");
  const fileTypeSvg = searchparams.get("fileType[svg]") === "true";
  const fileTypePixel = searchparams.get("fileType[pixel]") === "true";
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
    status: {
      locked: locked || false,
      oneOfOne: oneOfOne || false,
    },
    forSale: forSale || false,
    trendingSales: trendingSales || false,
    sold: sold || false,
    fileType: {
      svg: fileTypeSvg || false,
      pixel: fileTypePixel || false,
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
    status: false,
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
        w-full mobileMd:w-64 h-screen 
        p-3 backdrop-blur-md 
        bg-gradient-to-b from-[#000000]/70 to-[#000000]/90 
        overflow-y-auto transition-transform
        ${open ? "translate-x-0" : "-translate-x-full"}
      `}
    >
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <p className="text-xl font-black text-stamp-grey">
          FILTER
        </p>
        <button
          onClick={handleClose}
          className="text-red-500 hover:bg-gray-200 rounded-lg w-8 h-8 flex items-center justify-center"
        >
          <CrossIcon />
          <span className="sr-only">Close menu</span>
        </button>
      </div>

      {/* Filter Sections */}
      <div className="space-y-4">
        {/* Buy Now Section */}
        <FilterSection
          title="Buy Now"
          section="buyNow"
          expanded={expandedSections.buyNow}
          toggle={() => toggleSection("buyNow")}
        >
          <div className="space-y-2">
            <Checkbox
              label="Atomic"
              checked={filters.buyNow.atomic}
              onChange={(checked) => {
                handleFilterChange("buyNow", { atomic: checked });
              }}
            />
            <Checkbox
              label="Dispenser"
              checked={filters.buyNow.dispenser}
              onChange={(checked) => {
                handleFilterChange("buyNow", { dispenser: checked });
              }}
            />
          </div>
        </FilterSection>

        {/* Status Section */}
        <FilterSection
          title="Status"
          section="status"
          expanded={expandedSections.status}
          toggle={() => toggleSection("status")}
        >
          <div className="space-y-2">
            <Checkbox
              label="Locked"
              checked={filters.status.locked}
              onChange={(checked) => {
                handleFilterChange("status", { locked: checked });
              }}
            />
            <Checkbox
              label="1:1"
              checked={filters.status.oneOfOne}
              onChange={(checked) => {
                handleFilterChange("status", { oneOfOne: checked });
              }}
            />
          </div>
        </FilterSection>

        {/* Market Section */}
        <FilterSection
          title="Market"
          section="market"
          expanded={expandedSections.market}
          toggle={() => toggleSection("market")}
        >
          <div className="space-y-2">
            <Checkbox
              label="For Sale"
              checked={filters.forSale}
              onChange={(checked) => handleFilterChange("forSale", checked)}
            />
            <Checkbox
              label="Trending Sales"
              checked={filters.trendingSales}
              onChange={(checked) =>
                handleFilterChange("trendingSales", checked)}
            />
            <Checkbox
              label="Sold"
              checked={filters.sold}
              onChange={(checked) => handleFilterChange("sold", checked)}
            />
          </div>
        </FilterSection>

        {/* File Type Section */}
        <FilterSection
          title="File Type"
          section="fileType"
          expanded={expandedSections.fileType}
          toggle={() => toggleSection("fileType")}
        >
          <div className="space-y-2">
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
              label="Pixel"
              checked={filters.fileType.pixel}
              onChange={(checked) =>
                handleFilterChange("fileType", {
                  ...filters.fileType,
                  pixel: checked,
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
              label="WEBP"
              checked={filters.fileType.webp}
              onChange={(checked) =>
                handleFilterChange("fileType", {
                  ...filters.fileType,
                  webp: checked,
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
              label="JPEG"
              checked={filters.fileType.jpeg}
              onChange={(checked) =>
                handleFilterChange("fileType", {
                  ...filters.fileType,
                  jpeg: checked,
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
              label="OLGA"
              checked={filters.fileType.olga}
              onChange={(checked) =>
                handleFilterChange("fileType", {
                  ...filters.fileType,
                  olga: checked,
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
          </div>
        </FilterSection>

        {/* Stamp Range Section */}
        <FilterSection
          title="Stamp Range"
          section="stampRange"
          expanded={expandedSections.stampRange}
          toggle={() => toggleSection("stampRange")}
        >
          <div className="space-y-4">
            {/* Preset Ranges */}
            <div className="space-y-2">
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
                  <label className="text-sm text-stamp-grey">
                    First {value} Stamps
                  </label>
                </div>
              ))}
            </div>

            {/* Custom Range */}
            <div className="pt-2 border-t border-stamp-purple-highlight/20">
              <div className="flex items-center gap-2 mb-2 text-stamp-grey-light">
                <span className="text-sm font-medium">Custom Range</span>
              </div>
              <div className="space-y-2">
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

        {/* Price Range Section */}
        <FilterSection
          title="Price Filter"
          section="priceRange"
          expanded={expandedSections.priceRange}
          toggle={() => toggleSection("priceRange")}
        >
          <div className="space-y-2">
            <RangeInput
              label="Min Price"
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
              label="Max Price"
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

        {
          /* Sort Order
        <div className="p-4 border-t border-stamp-purple-highlight/20">
          <label className="block text-sm font-medium mb-2 text-stamp-grey">
            Sort By
          </label>
          <select
            value={filters.sortOrder}
            onChange={(e) => handleFilterChange("sortOrder", e.target.value)}
            className="w-full p-2 border border-purple-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 bg-white text-stamp-grey"
          >
            <option value="index_desc">Stamp Index: High to Low</option>
            <option value="index_asc">Stamp Index: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="price_asc">Price: Low to High</option>
          </select>
        </div>*/
        }

        {/* Clear Filters Button */}
        <button
          onClick={handleClearFilters}
          className="w-full p-2 mt-4 text-red-500 border border-red-500 rounded-lg hover:bg-red-500 hover:text-white transition-colors"
        >
          CLEAR FILTERS
        </button>
      </div>
    </div>
  );
};
