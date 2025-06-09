import { useEffect, useRef, useState } from "preact/hooks";
import {
  STAMP_EDITIONS,
  STAMP_FILETYPES,
  STAMP_MARKET,
  STAMP_RANGES,
} from "$globals";
import { inputCheckbox } from "$form";
import { labelLogicResponsive, labelXsPosition, labelXsR } from "$text";
import { CollapsibleSection } from "$islands/layout/CollapsibleSection.tsx";
import { Checkbox, RangeSlider } from "$islands/filter/FilterComponents.tsx";
import { StampFilters } from "$islands/filter/FilterOptionsStamp.tsx";

const defaultFilters: StampFilters = {
  market: [],
  marketMin: "",
  marketMax: "",
  fileType: [],
  editions: [],
  range: null,
  rangeMin: "",
  rangeMax: "",
};

export function filtersToQueryParams(search: string, filters: StampFilters) {
  const queryParams = new URLSearchParams(search);

  // MARKET
  if (filters.market.length > 0) {
    queryParams.set("market", filters.market.join(","));
  } else {
    queryParams.delete("market");
  }

  // Handle market price range
  if (filters.marketMin) {
    queryParams.set("marketMin", filters.marketMin);
  } else {
    queryParams.delete("marketMin");
  }

  if (filters.marketMax) {
    queryParams.set("marketMax", filters.marketMax);
  } else {
    queryParams.delete("marketMax");
  }

  // FILETYPE
  if (filters.fileType.length > 0) {
    // Convert 'jpg' to 'jpeg' and 'mp3' to 'mpeg' in the URL parameters
    const fileTypes = filters.fileType.map((type) => {
      if (type === "jpg") return "jpeg";
      if (type === "mp3") return "mpeg";
      return type;
    });
    queryParams.set("filetype", fileTypes.join(","));
  } else {
    queryParams.delete("filetype");
  }

  // EDITIONS
  if (filters.editions.length > 0) {
    queryParams.set("editions", filters.editions.join(","));
  } else {
    queryParams.delete("editions");
  }

  // RANGE
  if (filters.range) {
    queryParams.set("range", filters.range);
  } else {
    queryParams.delete("range");
  }

  if (filters.rangeMin) {
    queryParams.set("rangeMin", filters.rangeMin);
  } else {
    queryParams.delete("rangeMin");
  }

  if (filters.rangeMax) {
    queryParams.set("rangeMax", filters.rangeMax);
  } else {
    queryParams.delete("rangeMax");
  }

  return queryParams.toString();
}

export function filtersToServicePayload(filters: typeof defaultFilters) {
  const filterPayload = {
    vector: {
      filetypeFilters: [] as STAMP_FILETYPES[],
      ident: ["STAMP"],
    },
    pixel: {
      filetypeFilters: [] as STAMP_FILETYPES[],
      ident: ["STAMP, SRC-721"],
    },
    recursive: {
      filetypeFilters: [] as STAMP_FILETYPES[],
      ident: ["SRC-721"],
    },
    audio: {
      filetypeFilters: [] as STAMP_FILETYPES[],
      ident: ["STAMP"],
    },
    encoding: {
      filetypeFilters: [] as STAMP_FILETYPES[],
      ident: ["STAMP"],
    },
  };

  // JPG/JPEG (combined)
  if (filters.fileType.includes("jpg")) {
    filterPayload.pixel.filetypeFilters.push("jpg");
    filterPayload.pixel.filetypeFilters.push("jpeg");
  }

  // PNG
  if (filters.fileType.includes("png")) {
    filterPayload.pixel.filetypeFilters.push("png");
  }

  // GIF
  if (filters.fileType.includes("gif")) {
    filterPayload.pixel.filetypeFilters.push("gif");
  }

  // WEBP
  if (filters.fileType.includes("webp")) {
    filterPayload.pixel.filetypeFilters.push("webp");
  }

  // AVIF
  if (filters.fileType.includes("avif")) {
    filterPayload.pixel.filetypeFilters.push("avif");
  }

  // BMP
  if (filters.fileType.includes("bmp")) {
    filterPayload.pixel.filetypeFilters.push("bmp");
  }

  // SVG
  if (filters.fileType.includes("svg")) {
    filterPayload.vector.filetypeFilters.push("svg");
    filterPayload.recursive.filetypeFilters.push("svg");
  }

  // HTML
  if (filters.fileType.includes("html")) {
    filterPayload.vector.filetypeFilters.push("html");
    filterPayload.recursive.filetypeFilters.push("html");
  }

  // TXT
  // if (filters.fileType.includes("txt")) {
  //   filterPayload.vector.filetypeFilters.push("txt");
  //   filterPayload.recursive.filetypeFilters.push("txt");
  // }

  // MP3/MPEG (combined)
  if (filters.fileType.includes("mp3")) {
    filterPayload.audio.filetypeFilters.push("mp3");
    filterPayload.audio.filetypeFilters.push("mpeg");
  }

  // LEGACY
  if (filters.fileType.includes("legacy")) {
    filterPayload.encoding.filetypeFilters.push("legacy");
  }

  // OLGA
  if (filters.fileType.includes("olga")) {
    filterPayload.encoding.filetypeFilters.push("olga");
  }

  // Collect all file types
  const filetypeFilters = Object.entries(filterPayload).reduce(
    (acc, [_key, value]) => {
      if (value.filetypeFilters.length > 0) {
        acc.push(...value.filetypeFilters);
      }
      return acc;
    },
    [] as STAMP_FILETYPES[],
  );

  // Collect edition filters
  const editionFilters: STAMP_EDITIONS[] = [];
  if (filters.editions.includes("single")) editionFilters.push("single");
  if (filters.editions.includes("multiple")) editionFilters.push("multiple");
  if (filters.editions.includes("locked")) editionFilters.push("locked");
  if (filters.editions.includes("unlocked")) editionFilters.push("unlocked");
  if (filters.editions.includes("divisible")) editionFilters.push("divisible");

  return {
    ident: [],
    filetypeFilters: Array.from(new Set(filetypeFilters)),
    editionFilters: editionFilters.length > 0 ? editionFilters : undefined,
  };
}

// export function queryParamsToServicePayload(query: URLSearchParams): {
//   filterBy: STAMP_FILTER_TYPES[];
// } {
//   return {
//     filterBy: [],
//   };
// }

export const allQueryKeysFromFilters = [
  "market",
  "marketMin",
  "marketMax",
  "filetype",
  "editions",
  "range",
  "rangeMin",
  "rangeMax",
];

export function queryParamsToFilters(query: string): StampFilters {
  const params = new URLSearchParams(query);
  // Initialize with default filters
  const filters = { ...defaultFilters };

  // ONLY handle flat filetype parameter
  const flatFiletype = params.get("filetype");
  if (flatFiletype) {
    filters.fileType = flatFiletype.split(",") as STAMP_FILETYPES[];
  }

  // Parse market parameter (comma-separated string to array)
  const marketParam = params.get("market");
  if (marketParam) {
    filters.market = marketParam.split(",") as STAMP_MARKET[];
  }

  // Parse market price range
  const marketMin = params.get("marketMin");
  if (marketMin) {
    filters.marketMin = marketMin;
  }

  const marketMax = params.get("marketMax");
  if (marketMax) {
    filters.marketMax = marketMax;
  }

  // Parse range parameters (flat structure)
  const range = params.get("range");
  if (range) {
    filters.range = range as STAMP_RANGES;
  }

  const rangeMin = params.get("rangeMin");
  if (rangeMin) {
    filters.rangeMin = rangeMin;
  }

  const rangeMax = params.get("rangeMax");
  if (rangeMax) {
    filters.rangeMax = rangeMax;
  }

  // Parse editions parameter (comma-separated string to array)
  const editionsParam = params.get("editions");
  if (editionsParam) {
    filters.editions = editionsParam.split(",") as STAMP_EDITIONS[];
  }

  return filters;
}

export function queryParamsToServicePayload(search: string) {
  const filters = queryParamsToFilters(search);
  // Convert filters to service payload format
  // This will depend on what your service expects
  return {
    fileTypes: filters.fileType,
    market: filters.market,
    editions: filters.editions,
    range: filters.range,
    priceRange: filters.market.length > 0
      ? { min: filters.marketMin, max: filters.marketMax }
      : undefined,
  };
}

interface RadioProps {
  label: string;
  value: string;
  checked: boolean;
  onChange: () => void;
  name: string;
}

const Radio = ({ label, value, checked, onChange, name }: RadioProps) => {
  const [canHover, setCanHover] = useState(true);

  const handleChange = () => {
    onChange();
    setTimeout(() => setCanHover(false), 0);
  };

  const handleMouseLeave = () => {
    setCanHover(true);
  };

  return (
    <div
      className="flex items-center py-1.5 mobileLg:py-1.5 cursor-pointer group"
      onMouseLeave={handleMouseLeave}
      onClick={handleChange}
    >
      <input
        className={inputCheckbox(checked, canHover)}
        type="radio"
        name={name}
        value={value}
        checked={checked}
        readOnly
      />
      <label className={labelLogicResponsive(checked, canHover)}>
        {label}
      </label>
    </div>
  );
};

// Helper function to check if a section has active filters
function hasActiveFilters(section: string, filters: StampFilters): boolean {
  switch (section) {
    case "market":
      return filters.market.length > 0;
    case "priceRange":
      return filters.marketMin !== "" || filters.marketMax !== "";
    case "fileType":
      return filters.fileType.length > 0;
    case "editions":
      return filters.editions.length > 0;
    case "range":
      return filters.range !== null ||
        filters.rangeMin !== "" ||
        filters.rangeMax !== "";
    default:
      return false;
  }
}

export const FilterContentStamp = ({
  initialFilters,
  onFiltersChange,
}: {
  initialFilters: StampFilters;
  onFiltersChange: (filters: StampFilters) => void;
}) => {
  const [filters, setFilters] = useState(initialFilters);
  const [expandedSections, setExpandedSections] = useState({
    fileType: hasActiveFilters("fileType", filters),
    editions: hasActiveFilters("editions", filters),
    range: hasActiveFilters("range", filters),
    market: hasActiveFilters("market", filters),
    customRange: filters.rangeMin !== "" || filters.rangeMax !== "",
    priceRange: hasActiveFilters("priceRange", filters),
  });

  // Watch for changes to initialFilters
  useEffect(() => {
    setFilters(initialFilters);

    // When filters are cleared, explicitly reset min/max values in RangeSlider
    if (
      !initialFilters.range && !initialFilters.rangeMin &&
      !initialFilters.rangeMax
    ) {
      // Force RangeSlider to reset by updating its key
      setExpandedSections((prev) => ({
        ...prev,
        customRange: false, // Close the custom range section
      }));
    } else {
      setExpandedSections((prev) => ({
        ...prev,
        customRange: initialFilters.rangeMin !== "" ||
          initialFilters.rangeMax !== "",
      }));
    }
  }, [initialFilters]);

  const _handleFilterChange = (
    category: keyof typeof defaultFilters,
    value: unknown,
  ) => {
    setFilters((prevFilters) => {
      const newFilters = {
        ...prevFilters,
        [category]: Array.isArray(value)
          ? [...value]
          : typeof value === "object"
          ? { ...prevFilters[category], ...value }
          : value,
      };
      onFiltersChange(newFilters);
      return newFilters;
    });
  };

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    });
  };

  const [isDraggingPrice, setIsDraggingPrice] = useState(false);
  const [isDraggingRange, setIsDraggingRange] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseUp = (_e: MouseEvent) => {
      // Check if we're currently dragging either slider
      if (isDraggingPrice) {
        // Reset dragging state
        setIsDraggingPrice(false);
      }

      if (isDraggingRange) {
        // Reset dragging state
        setIsDraggingRange(false);
      }
    };

    // Add event listener for mouse up
    globalThis.addEventListener("mouseup", handleMouseUp);
    globalThis.addEventListener("mouseleave", handleMouseUp);

    // Clean up
    return () => {
      globalThis.removeEventListener("mouseup", handleMouseUp);
      globalThis.removeEventListener("mouseleave", handleMouseUp);
    };
  }, [isDraggingPrice, isDraggingRange]);

  const _handlePriceRangeChange = (min: number, max: number) => {
    setFilters((prevFilters) => {
      const newFilters = {
        ...prevFilters,
        marketMin: min === 0 ? "" : min.toString(),
        marketMax: max === Infinity ? "" : max.toString(),
      };
      onFiltersChange(newFilters);
      return newFilters;
    });
  };

  const handleRangeChange = (value: string | null) => {
    setFilters((prevFilters) => {
      // If clicking the same value, clear it
      if (prevFilters.range === value) {
        const newFilters = {
          ...prevFilters,
          range: null,
          rangeMin: "",
          rangeMax: "",
        };
        onFiltersChange(newFilters);
        return newFilters;
      }

      // Otherwise set the new value
      const newFilters = {
        ...prevFilters,
        range: value as STAMP_RANGES | null,
        rangeMin: "",
        rangeMax: "",
      };
      onFiltersChange(newFilters);
      return newFilters;
    });
  };

  const handleCustomRangeToggle = () => {
    setFilters((prevFilters) => {
      // If custom range is active, clear it
      if (prevFilters.rangeMin || prevFilters.rangeMax) {
        const newFilters = {
          ...prevFilters,
          range: null,
          rangeMin: "",
          rangeMax: "",
        };
        onFiltersChange(newFilters);
        return newFilters;
      }

      // Otherwise just toggle the section
      setExpandedSections((prev) => ({
        ...prev,
        customRange: true,
      }));
      return prevFilters;
    });
  };

  const handleRangeSliderChange = (min: number, max: number) => {
    setFilters((prevFilters) => {
      const newFilters = {
        ...prevFilters,
        range: null,
        rangeMin: min.toString(),
        rangeMax: max === Infinity ? "" : max.toString(),
      };

      // Important: update parent component state
      onFiltersChange(newFilters);
      return newFilters;
    });
  };

  // Fix: Add a dedicated file type toggle function
  const toggleFileType = (type: STAMP_FILETYPES) => {
    setFilters((prevFilters) => {
      let newFileTypes = [...prevFilters.fileType];

      if (type === "jpg") {
        // Remove both 'jpg' and 'jpeg' if either is present
        if (newFileTypes.includes("jpg") || newFileTypes.includes("jpeg")) {
          newFileTypes = newFileTypes.filter(
            (t) => t !== "jpg" && t !== "jpeg",
          );
        } else {
          newFileTypes.push("jpg");
        }
      } else if (type === "mp3") {
        // Remove both 'mp3' and 'mpeg' if either is present
        if (newFileTypes.includes("mp3") || newFileTypes.includes("mpeg")) {
          newFileTypes = newFileTypes.filter(
            (t) => t !== "mp3" && t !== "mpeg",
          );
        } else {
          newFileTypes.push("mp3");
        }
      } else {
        // Default toggle for other types
        const index = newFileTypes.indexOf(type);
        if (index === -1) {
          newFileTypes.push(type);
        } else {
          newFileTypes.splice(index, 1);
        }
      }

      const newFilters = {
        ...prevFilters,
        fileType: newFileTypes,
      };
      onFiltersChange(newFilters);
      return newFilters;
    });
  };

  // Fix: Add a dedicated editions toggle function
  const toggleEdition = (type: STAMP_EDITIONS) => {
    setFilters((prevFilters) => {
      const newEditions = [...prevFilters.editions];
      const index = newEditions.indexOf(type);

      if (index === -1) {
        newEditions.push(type);
      } else {
        newEditions.splice(index, 1);
      }

      const newFilters = {
        ...prevFilters,
        editions: newEditions,
      };
      onFiltersChange(newFilters);
      return newFilters;
    });
  };

  // Helper function to toggle market type
  const toggleMarket = (type: STAMP_MARKET) => {
    setFilters((prevFilters) => {
      // For radio buttons, we either select the new type or clear if it's already selected
      const newMarket = prevFilters.market.includes(type) ? [] : [type];

      const newFilters = {
        ...prevFilters,
        market: newMarket,
      };

      // If no market types are selected, reset price range
      if (newMarket.length === 0) {
        newFilters.marketMin = "";
        newFilters.marketMax = "";
      }

      onFiltersChange(newFilters);
      return newFilters;
    });
  };

  return (
    <div ref={drawerRef}>
      <CollapsibleSection
        title="MARKET PLACE"
        section="market"
        expanded={expandedSections.market}
        toggle={() => toggleSection("market")}
        variant="collapsibleTitle"
      >
        <Radio
          label="LISTINGS"
          value="listings"
          name="market"
          checked={filters.market.includes("listings")}
          onChange={() => toggleMarket("listings")}
        />
        <Radio
          label="SALES"
          value="sales"
          name="market"
          checked={filters.market.includes("sales")}
          onChange={() => toggleMarket("sales")}
        />
        {
          /*
        <Radio
          label="UTXO BOUND"
          value="atomic"
          name="market"
          checked={filters.market.includes("psbt")}
          onChange={() => toggleMarket("psbt")}
        />
          <Radio
            label="DISPENSERS"
            value="dispensers"
            checked={filters.market.includes("dispensers")}
            onChange={() => toggleMarket("dispensers")}
          />
        */
        }

        {
          /* Price Range Slider - only show if any market type is selected
        {filters.market.length > 0 && (
          <CollapsibleSection
            title="Price Range"
            section="priceRange"
            expanded={true}
            toggle={() => {}}
            variant="collapsibleLabel"
          >
            <RangeSlider
              variant="price"
              onChange={handlePriceRangeChange}
              initialMin={filters.marketMin ? parseFloat(filters.marketMin) : 0}
              initialMax={filters.marketMax
                ? parseFloat(filters.marketMax)
                : Infinity}
            />
          </CollapsibleSection>
        )} */
        }
      </CollapsibleSection>

      <CollapsibleSection
        title="FILE TYPE"
        section="fileType"
        expanded={expandedSections.fileType}
        toggle={() => toggleSection("fileType")}
        variant="collapsibleTitle"
      >
        {/* Category: PIXEL */}
        <div className={`${labelXsR} ${labelXsPosition}`}>
          PIXELS
        </div>
        <Checkbox
          key="jpg"
          label="JPG/JPEG"
          checked={filters.fileType.includes("jpg") ||
            filters.fileType.includes("jpeg")}
          onChange={() => toggleFileType("jpg")}
        />

        <Checkbox
          key="png"
          label="PNG"
          checked={filters.fileType.includes("png")}
          onChange={() => toggleFileType("png")}
        />
        <Checkbox
          key="gif"
          label="GIF"
          checked={filters.fileType.includes("gif")}
          onChange={() => toggleFileType("gif")}
        />
        <Checkbox
          key="webp"
          label="WEBP"
          checked={filters.fileType.includes("webp")}
          onChange={() => toggleFileType("webp")}
        />
        <Checkbox
          key="avif"
          label="AVIF"
          checked={filters.fileType.includes("avif")}
          onChange={() => toggleFileType("avif")}
        />
        <Checkbox
          key="bmp"
          label="BMP"
          checked={filters.fileType.includes("bmp")}
          onChange={() => toggleFileType("bmp")}
        />

        {/* Category: VECTOR */}
        <div className={`${labelXsR} ${labelXsPosition}`}>
          VECTOR
        </div>
        <Checkbox
          key="svg"
          label="SVG"
          checked={filters.fileType.includes("svg")}
          onChange={() => toggleFileType("svg")}
        />
        <Checkbox
          key="html"
          label="HTML"
          checked={filters.fileType.includes("html")}
          onChange={() => toggleFileType("html")}
        />
        {
          /* <Checkbox
          key="txt"
          label="TXT"
          checked={filters.fileType.includes("txt")}
          onChange={() => toggleFileType("txt")}
        />*/
        }

        {/* Category: AUDIO */}
        <div className={`${labelXsR} ${labelXsPosition}`}>
          AUDIO
        </div>
        <Checkbox
          key="mp3"
          label="MP3/MPEG"
          checked={filters.fileType.includes("mp3") ||
            filters.fileType.includes("mpeg")}
          onChange={() => toggleFileType("mp3")}
        />

        {/* Category: ENCODING */}
        <div className={`${labelXsR} ${labelXsPosition}`}>
          ENCODING
        </div>
        <Checkbox
          key="legacy"
          label="LEGACY"
          checked={filters.fileType.includes("legacy")}
          onChange={() => toggleFileType("legacy")}
        />
        <Checkbox
          key="olga"
          label="OLGA"
          checked={filters.fileType.includes("olga")}
          onChange={() => toggleFileType("olga")}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="EDITIONS"
        section="editions"
        expanded={expandedSections.editions}
        toggle={() => toggleSection("editions")}
        variant="collapsibleTitle"
      >
        <Checkbox
          label="1/1"
          checked={filters.editions.includes("single")}
          onChange={() => toggleEdition("single")}
        />
        <Checkbox
          label="MULTIPLE"
          checked={filters.editions.includes("multiple")}
          onChange={() => toggleEdition("multiple")}
        />
        <Checkbox
          label="LOCKED"
          checked={filters.editions.includes("locked")}
          onChange={() => toggleEdition("locked")}
        />
        <Checkbox
          label="UNLOCKED"
          checked={filters.editions.includes("unlocked")}
          onChange={() => toggleEdition("unlocked")}
        />
        <Checkbox
          label="DIVISIBLE"
          checked={filters.editions.includes("divisible")}
          onChange={() => toggleEdition("divisible")}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="RANGE"
        section="range"
        expanded={expandedSections.range}
        toggle={() => toggleSection("range")}
        variant="collapsibleTitle"
      >
        {/* Preset ranges */}
        {[100, 1000, 5000, 10000].map((value) => (
          <Radio
            key={value}
            label={`< ${value}`}
            value={value.toString()}
            name="range"
            checked={filters.range === value.toString()}
            onChange={() => handleRangeChange(value.toString())}
          />
        ))}

        {/* Custom range option */}
        <Radio
          label="CUSTOM RANGE"
          value="custom"
          name="range"
          checked={!filters.range &&
            (filters.rangeMin !== "" || filters.rangeMax !== "")}
          onChange={handleCustomRangeToggle}
        />

        {/* Custom range slider */}
        <CollapsibleSection
          title=""
          section="customRange"
          expanded={expandedSections.customRange}
          toggle={() => {}}
          variant="collapsibleLabel"
        >
          <RangeSlider
            key={`range-${filters.rangeMin || "0"}-${
              filters.rangeMax || "max"
            }`}
            variant="range"
            onChange={handleRangeSliderChange}
            initialMin={filters.rangeMin ? parseInt(filters.rangeMin) : 0}
            initialMax={filters.rangeMax
              ? parseInt(filters.rangeMax)
              : Infinity}
          />
        </CollapsibleSection>
      </CollapsibleSection>
    </div>
  );
};

export default FilterContentStamp;
