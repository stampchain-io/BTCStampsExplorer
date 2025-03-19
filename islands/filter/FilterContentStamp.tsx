import { useEffect, useRef, useState } from "preact/hooks";
import {
  STAMP_EDITIONS,
  STAMP_FILETYPES,
  STAMP_MARKET,
  STAMP_RARITY,
} from "$globals";
import {
  checkboxIcon,
  labelGreyBaseFilter,
} from "$islands/filter/FilterStyles.ts";
import {
  Checkbox,
  CollapsibleSection,
  RangeSlider,
} from "$islands/filter/FilterComponents.tsx";
import { StampFilters } from "$islands/filter/FilterOptionsStamp.tsx";

const defaultFilters: StampFilters = {
  market: [],
  marketMin: "",
  marketMax: "",
  fileType: [],
  editions: [],
  rarity: {
    preset: null,
    min: "",
    max: "",
  },
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
    queryParams.set("filetype", filters.fileType.join(","));
  } else {
    queryParams.delete("filetype");
  }

  // EDITIONS
  if (filters.editions.length > 0) {
    queryParams.set("editions", filters.editions.join(","));
  } else {
    queryParams.delete("editions");
  }

  // RARITY
  if (filters.rarity.preset) {
    queryParams.set("rarity", filters.rarity.preset);
  } else {
    queryParams.delete("rarity");
    if (filters.rarity.min) {
      queryParams.set("rarityMin", filters.rarity.min);
    } else {
      queryParams.delete("rarityMin");
    }
    if (filters.rarity.max) {
      queryParams.set("rarityMax", filters.rarity.max);
    } else {
      queryParams.delete("rarityMax");
    }
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

  // MP3/MPEG (combined)
  if (filters.fileType.includes("mp3")) {
    filterPayload.audio.filetypeFilters.push("mp3");
    filterPayload.audio.filetypeFilters.push("mpeg");
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
    (acc, [key, value]) => {
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
  "rarity",
  "rarityMin",
  "rarityMax",
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

  // Parse rarity params
  const rarityPreset = params.get("rarity");
  if (rarityPreset) {
    filters.rarity.preset = rarityPreset;
  }

  const rarityMin = params.get("rarityMin");
  if (rarityMin) {
    filters.rarity.min = rarityMin;
  }

  const rarityMax = params.get("rarityMax");
  if (rarityMax) {
    filters.rarity.max = rarityMax;
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
    rarity: filters.rarity,
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
}

const Radio = ({ label, value, checked, onChange }: RadioProps) => {
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
        className={checkboxIcon(checked, canHover)}
        type="radio"
        name="rarity"
        value={value}
        checked={checked}
        readOnly
      />
      <label className={labelGreyBaseFilter(checked, canHover)}>
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
    case "rarity":
      return filters.rarity.preset !== null ||
        filters.rarity.min !== "" ||
        filters.rarity.max !== "";
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

  // Watch for changes to initialFilters
  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const [expandedSections, setExpandedSections] = useState({
    fileType: hasActiveFilters("fileType", filters),
    editions: hasActiveFilters("editions", filters),
    rarity: hasActiveFilters("rarity", filters),
    market: hasActiveFilters("market", filters),
    customRange: hasActiveFilters("customRange", filters),
    priceRange: hasActiveFilters("priceRange", filters),
  });

  const handleFilterChange = (
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

  const filterCollectionSm =
    "flex justify-end text-xs mobileLg:text-sm font-light text-stamp-grey-darker mt-1 mobileLg:mt-0 -mb-5 cursor-default";

  const [isDraggingPrice, setIsDraggingPrice] = useState(false);
  const [isDraggingRarity, setIsDraggingRarity] = useState(false);
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseUp = (_e: MouseEvent) => {
      // Check if we're currently dragging either slider
      if (isDraggingPrice) {
        // Reset dragging state
        setIsDraggingPrice(false);
      }

      if (isDraggingRarity) {
        // Reset dragging state
        setIsDraggingRarity(false);
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
  }, [isDraggingPrice, isDraggingRarity]);

  const handlePriceRangeChange = (min: number, max: number) => {
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

  const handleRarityRangeChange = (min: number, max: number) => {
    console.log("Rarity range changed:", {
      min,
      max,
      minStr: min.toString(),
      maxStr: max === Infinity ? "" : max.toString(),
    });

    // Create new state with both the new flat format and transitional structure
    setFilters((prevFilters) => {
      const newFilters = {
        ...prevFilters,
        rarity: {
          ...prevFilters.rarity,
          // New flat format
          preset: null,
          min: min.toString(),
          max: max === Infinity ? "" : max.toString(),
        },
      };

      // Important: update parent component state
      onFiltersChange(newFilters);
      return newFilters;
    });
  };

  // Fix: Add a dedicated file type toggle function
  const toggleFileType = (type: STAMP_FILETYPES) => {
    setFilters((prevFilters) => {
      const newFileTypes = [...prevFilters.fileType];
      const index = newFileTypes.indexOf(type);

      if (index === -1) {
        newFileTypes.push(type);
      } else {
        newFileTypes.splice(index, 1);
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

  // Update rarity handling
  const handleRarityChange = (value: string | null, isCustomRange = false) => {
    setFilters((prevFilters) => {
      let newRarity;

      if (isCustomRange) {
        // For custom range toggle
        if (
          prevFilters.rarity.preset === null &&
          (prevFilters.rarity.min !== "" || prevFilters.rarity.max !== "")
        ) {
          // Clear custom range if it was active
          newRarity = {
            preset: null,
            min: "",
            max: "",
          };
        } else {
          // Enable custom range with empty values
          newRarity = {
            preset: null,
            min: "",
            max: "",
          };
        }
      } else if (value === prevFilters.rarity.preset) {
        // Deselect if already selected
        newRarity = {
          preset: null,
          min: "",
          max: "",
        };
      } else {
        // Select new preset and reset custom range
        newRarity = {
          preset: value,
          min: "",
          max: "",
        };
      }

      const newFilters = {
        ...prevFilters,
        rarity: newRarity,
      };

      // Important: Call onFiltersChange to update parent state
      onFiltersChange(newFilters);
      return newFilters;
    });
  };

  // Helper function to toggle market type
  const toggleMarket = (type: STAMP_MARKET) => {
    setFilters((prevFilters) => {
      const newMarket = [...prevFilters.market];
      const index = newMarket.indexOf(type);

      if (index === -1) {
        newMarket.push(type);
      } else {
        newMarket.splice(index, 1);
      }

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
    <div className="space-y-1 mobileLg:space-y-1.5" ref={drawerRef}>
      <CollapsibleSection
        title="MARKET PLACE"
        section="market"
        expanded={expandedSections.market}
        toggle={() => toggleSection("market")}
        variant="collapsibleTitle"
      >
        {/* Category: LISTINGS */}
        <Checkbox
          label="ATOMIC"
          checked={filters.market.includes("atomic")}
          onChange={() => toggleMarket("atomic")}
        />
        <Checkbox
          label="DISPENSERS"
          checked={filters.market.includes("dispensers")}
          onChange={() => toggleMarket("dispensers")}
        />
        <Checkbox
          label="LISTINGS"
          checked={filters.market.includes("listings")}
          onChange={() => toggleMarket("listings")}
        />
        <Checkbox
          label="SALES"
          checked={filters.market.includes("sales")}
          onChange={() => toggleMarket("sales")}
        />

        {/* Price Range Slider - only show if any market type is selected */}
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
        )}
      </CollapsibleSection>

      <CollapsibleSection
        title="FILE TYPE"
        section="fileType"
        expanded={expandedSections.fileType}
        toggle={() => toggleSection("fileType")}
        variant="collapsibleTitle"
      >
        {/* Category: PIXEL */}
        <div className={filterCollectionSm}>
          PIXELS
        </div>
        <Checkbox
          key="jpg"
          label="JPG/JPEG"
          checked={filters.fileType.includes("jpg")}
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
        <div className={filterCollectionSm}>
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

        {/* Category: AUDIO */}
        <div className={filterCollectionSm}>
          AUDIO
        </div>
        <Checkbox
          key="mp3"
          label="MP3/MPEG"
          checked={filters.fileType.includes("mp3")}
          onChange={() => toggleFileType("mp3")}
        />

        {/* Category: ENCODING */}
        <div className={filterCollectionSm}>
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
        title="RARITY"
        section="rarity"
        expanded={expandedSections.rarity}
        toggle={() => toggleSection("rarity")}
        variant="collapsibleTitle"
      >
        {/* Standard Radio Buttons */}
        {[100, 1000, 5000, 10000].map((value) => (
          <Radio
            key={value}
            label={`< ${value}`}
            value={value.toString()}
            checked={filters.rarity.preset === value.toString()}
            onChange={() => handleRarityChange(value.toString())}
          />
        ))}

        {/* Custom Range Radio Button */}
        <Radio
          label="STAMP RANGE"
          value="stamp range"
          checked={filters.rarity.preset === null &&
            (filters.rarity.min !== "" || filters.rarity.max !== "")}
          onChange={() => {
            // Toggle custom range selection
            if (
              filters.rarity.preset === null &&
              (filters.rarity.min !== "" || filters.rarity.max !== "")
            ) {
              // Deselect custom range
              handleFilterChange("rarity", {
                preset: null,
                min: "",
                max: "",
              });
            } else {
              // Select custom range
              handleFilterChange("rarity", {
                preset: null,
                min: "",
                max: "",
              });
            }

            // Toggle the custom range section
            setExpandedSections({
              ...expandedSections,
              customRange: !expandedSections.customRange,
            });
          }}
        />

        {/* Custom Range Slider (only shown when custom range is selected) */}
        {expandedSections.customRange && (
          <CollapsibleSection
            title=""
            section="customRange"
            expanded={true}
            toggle={() => {}}
            variant="collapsibleLabel"
          >
            <RangeSlider
              variant="rarity"
              onChange={handleRarityRangeChange}
            />
          </CollapsibleSection>
        )}
      </CollapsibleSection>
    </div>
  );
};

export default FilterContentStamp;
