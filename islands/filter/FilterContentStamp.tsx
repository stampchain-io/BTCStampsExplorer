import { ComponentChildren, useEffect, useRef, useState } from "preact/hooks";
import { STAMP_SUFFIX_FILTERS } from "$globals";
import type { filterOptions } from "$lib/utils/filterOptions.ts";
import { useDebouncedCallback } from "$lib/utils/filterUtils.ts";
import {
  checkboxIcon,
  labelGreyBaseFilter,
} from "$islands/filter/FilterStyles.ts";
import {
  Checkbox,
  CollapsibleSection,
  RangeInput,
  RangeSlider,
} from "$islands/filter/FilterComponents.tsx";

const defaultFilters = {
  market: {
    atomic: false,
    dispenser: false,
    listings: false,
    sales: false,
    priceRange: {
      min: "",
      max: "",
    },
  },
  fileType: {
    jpg: false,
    png: false,
    gif: false,
    webp: false,
    avif: false,
    bmp: false,
    mp3: false,
    svg: false,
    html: false,
    legacy: false,
    olga: false,
  },
  editions: {
    locked: false,
    oneOfOne: false,
    multiple: false,
    unlocked: false,
    divisible: false,
  },
  rarity: {
    sub: false,
    stampRange: {
      min: "",
      max: "",
    },
  },
};

export function filtersToQueryParams(
  search: string,
  filters: typeof defaultFilters,
) {
  const queryParams = new URLSearchParams(search);
  Object.entries(filters).forEach(([category, value]) => {
    if (typeof value !== null && typeof value === "object") {
      Object.entries(value).forEach(([key, val]) => {
        // Handle rarity parameters
        if (category === "rarity") {
          // If we have stampRange values, ignore sub
          if (key === "stampRange") {
            // Always clean up stampRange parameters first
            queryParams.delete(`${category}[${key}][min]`);
            queryParams.delete(`${category}[${key}][max]`);

            // Only add parameters if we have non-empty values
            if (val.min && val.min.toString().trim() !== "") {
              queryParams.append(`${category}[${key}][min]`, val.min);
            }
            if (val.max && val.max.toString().trim() !== "") {
              queryParams.append(`${category}[${key}][max]`, val.max);
            }
          } else if (key === "sub" && val) {
            queryParams.set(`${category}[${key}]`, val.toString());
          }
          return;
        }

        // Handle price range
        if (category === "market" && key === "priceRange") {
          // Always clean up priceRange parameters first
          queryParams.delete(`${category}[${key}][min]`);
          queryParams.delete(`${category}[${key}][max]`);

          // Only add parameters if we have non-empty values
          if (val.min && val.min.toString().trim() !== "") {
            queryParams.append(`${category}[${key}][min]`, val.min);
          }
          if (val.max && val.max.toString().trim() !== "") {
            queryParams.append(`${category}[${key}][max]`, val.max);
          }
          return;
        }

        const strVal = val.toString();
        if (typeof val === "boolean") {
          if (strVal !== "false") {
            queryParams.set(`${category}[${key}]`, strVal);
          } else {
            queryParams.delete(`${category}[${key}]`);
          }
        } else if (val !== "") {
          queryParams.set(`${category}[${key}]`, strVal);
        }
      });
    }
  });
  return queryParams.toString();
}

export function filtersToServicePayload(filters: typeof defaultFilters) {
  const filterPayload = {
    vector: {
      suffixFilters: [] as Partial<
        typeof filterOptions["vector"]["suffixFilters"]
      >,
      ident: ["STAMP"],
    },
    pixel: {
      suffixFilters: [] as Partial<
        typeof filterOptions["pixel"]["suffixFilters"]
      >,
      ident: ["STAMP, SRC-721"],
    },
    recursive: {
      suffixFilters: [] as Partial<
        typeof filterOptions["recursive"]["suffixFilters"]
      >,
      ident: ["SRC-721"],
    },
    audio: {
      suffixFilters: [] as Partial<
        typeof filterOptions["audio"]["suffixFilters"]
      >,
      ident: ["STAMP"],
    },
    encoding: {
      suffixFilters: [] as Partial<
        typeof filterOptions["encoding"]["suffixFilters"]
      >,
      ident: ["STAMP"],
    },
  };

  // JPG/JPEG (combined)
  if (filters.fileType.jpg) {
    filterPayload.pixel.suffixFilters.push("jpg");
    filterPayload.pixel.suffixFilters.push("jpeg");
  }

  // PNG
  if (filters.fileType.png) {
    filterPayload.pixel.suffixFilters.push("png");
  }

  // GIF
  if (filters.fileType.gif) {
    filterPayload.pixel.suffixFilters.push("gif");
  }

  // WEBP
  if (filters.fileType.webp) {
    filterPayload.pixel.suffixFilters.push("webp");
  }

  // AVIF
  if (filters.fileType.avif) {
    filterPayload.pixel.suffixFilters.push("avif");
  }

  // BMP
  if (filters.fileType.bmp) {
    filterPayload.pixel.suffixFilters.push("bmp");
  }

  // MP3/MPEG (combined)
  if (filters.fileType.mp3) {
    filterPayload.audio.suffixFilters.push("mp3");
    filterPayload.audio.suffixFilters.push("mpeg");
  }

  // SVG
  if (filters.fileType.svg) {
    filterPayload.vector.suffixFilters.push("svg");
    filterPayload.recursive.suffixFilters.push("svg");
  }

  // HTML
  if (filters.fileType.html) {
    filterPayload.vector.suffixFilters.push("html");
    filterPayload.recursive.suffixFilters.push("html");
  }

  // LEGACY
  if (filters.fileType.legacy) {
    filterPayload.encoding.suffixFilters.push("legacy");
  }

  // OLGA
  if (filters.fileType.olga) {
    filterPayload.encoding.suffixFilters.push("olga");
  }

  const suffixFilters = Object.entries(filterPayload).reduce(
    (acc, [key, value]) => {
      if (value.suffixFilters.length > 0) {
        acc.push(...value.suffixFilters);
      }
      return acc;
    },
    [] as STAMP_SUFFIX_FILTERS[],
  );

  return {
    ident: [],
    suffixFilters: Array.from(new Set(suffixFilters)),
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
  // Market filters
  "market[atomic]",
  "market[dispenser]",
  "market[listings]",
  "market[sales]",
  "market[priceRange][min]",
  "market[priceRange][max]",

  // File type filters
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
  "fileType[legacy]",
  "fileType[olga]",

  // Editions filters
  "editions[locked]",
  "editions[oneOfOne]",
  "editions[multiple]",
  "editions[unlocked]",
  "editions[divisible]",

  // Rarity filters
  "rarity[sub]",
  "rarity[stampRange][min]",
  "rarity[stampRange][max]",
];

export function queryParamsToFilters(search: string) {
  const queryParams = new URLSearchParams(search);
  const filters = { ...defaultFilters };

  // Parse market params
  if (queryParams.get("market[atomic]") === "true") {
    filters.market.atomic = true;
  }
  if (queryParams.get("market[dispenser]") === "true") {
    filters.market.dispenser = true;
  }
  if (queryParams.get("market[listings]") === "true") {
    filters.market.listings = true;
  }
  if (queryParams.get("market[sales]") === "true") {
    filters.market.sales = true;
  }

  // Parse market price range
  const marketPriceMin = queryParams.get("market[priceRange][min]");
  const marketPriceMax = queryParams.get("market[priceRange][max]");
  if (marketPriceMin) {
    filters.market.priceRange.min = marketPriceMin;
  }
  if (marketPriceMax) {
    filters.market.priceRange.max = marketPriceMax;
  }

  // Parse editions params
  if (queryParams.get("editions[locked]") === "true") {
    filters.editions.locked = true;
  }
  if (queryParams.get("editions[oneOfOne]") === "true") {
    filters.editions.oneOfOne = true;
  }
  if (queryParams.get("editions[multiple]") === "true") {
    filters.editions.multiple = true;
  }
  if (queryParams.get("editions[unlocked]") === "true") {
    filters.editions.unlocked = true;
  }
  if (queryParams.get("editions[divisible]") === "true") {
    filters.editions.divisible = true;
  }

  // Parse fileType params
  if (
    queryParams.get("fileType[jpg]") === "true" ||
    queryParams.get("fileType[jpeg]") === "true"
  ) {
    filters.fileType.jpg = true;
  }
  if (queryParams.get("fileType[png]") === "true") {
    filters.fileType.png = true;
  }
  if (queryParams.get("fileType[gif]") === "true") {
    filters.fileType.gif = true;
  }
  if (queryParams.get("fileType[webp]") === "true") {
    filters.fileType.webp = true;
  }
  if (queryParams.get("fileType[avif]") === "true") {
    filters.fileType.avif = true;
  }
  if (queryParams.get("fileType[bmp]") === "true") {
    filters.fileType.bmp = true;
  }
  if (
    queryParams.get("fileType[mp3]") === "true" ||
    queryParams.get("fileType[mpeg]") === "true"
  ) {
    filters.fileType.mp3 = true;
  }
  if (queryParams.get("fileType[svg]") === "true") {
    filters.fileType.svg = true;
  }
  if (queryParams.get("fileType[html]") === "true") {
    filters.fileType.html = true;
  }
  if (queryParams.get("fileType[legacy]") === "true") {
    filters.fileType.legacy = true;
  }
  if (queryParams.get("fileType[olga]") === "true") {
    filters.fileType.olga = true;
  }

  // Parse rarity params
  const raritySubParam = queryParams.get("rarity[sub]");
  if (raritySubParam) {
    filters.rarity.sub = raritySubParam === "true";
  }

  // Parse rarity range params
  const rarityMinParam = queryParams.get("rarity[stampRange][min]");
  if (rarityMinParam) {
    filters.rarity.stampRange.min = rarityMinParam;
  }
  const rarityMaxParam = queryParams.get("rarity[stampRange][max]");
  if (rarityMaxParam) {
    filters.rarity.stampRange.max = rarityMaxParam;
  }

  return filters;
}

export function queryParamsToServicePayload(search: string) {
  const filters = queryParamsToFilters(search);
  // Convert filters to service payload format
  // This will depend on what your service expects
  return {
    // Map the filters to the format expected by your service
    // This is just an example - adjust based on your actual service requirements
    fileTypes: Object.entries(filters.fileType)
      .filter(([_, value]) => value)
      .map(([key]) => key),
    market: Object.entries(filters.market)
      .filter(([_, value]) => value)
      .map(([key]) => key),
    editions: Object.entries(filters.editions)
      .filter(([_, value]) => value)
      .map(([key]) => key),
    rarity: filters.rarity,
    priceRange: filters.market.priceRange,
  };
}

const Radio = ({ label, value, checked, onChange }) => {
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
function hasActiveFilters(section: string, filters: typeof defaultFilters) {
  switch (section) {
    case "fileType":
      return Object.values(filters.fileType).some((value) => value === true);
    case "editions":
      return Object.values(filters.editions).some((value) => value === true);
    case "rarity":
      return filters.rarity.sub !== false ||
        filters.rarity.stampRange.min !== "" ||
        filters.rarity.stampRange.max !== "";
    case "market":
      return filters.market.atomic ||
        filters.market.dispenser ||
        filters.market.listings ||
        filters.market.sales ||
        filters.market.priceRange.min !== "" ||
        filters.market.priceRange.max !== "";
    case "customRange": // For rarity custom range subsection
      return filters.rarity.stampRange.min !== "" ||
        filters.rarity.stampRange.max !== "";
    case "priceRange": // For market price range subsection
      return filters.market.priceRange.min !== "" ||
        filters.market.priceRange.max !== "";
    default:
      return false;
  }
}

export const FilterContentStamp = ({
  initialFilters,
  onFiltersChange,
}: {
  initialFilters: typeof defaultFilters;
  onFiltersChange: (filters: typeof defaultFilters) => void;
}) => {
  const [filters, setFilters] = useState(initialFilters);

  // Add this effect to watch for changes to initialFilters
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
  const debouncedOnFilterChange = useDebouncedCallback(
    (str: string) => {
      globalThis.location.href = globalThis.location.pathname + "?" +
        str;
    },
    500,
  );

  const handleFilterChange = (category: string, value: unknown) => {
    setFilters((prevFilters) => {
      const newFilters = {
        ...prevFilters,
        [category]: typeof value === "object"
          ? { ...prevFilters[category], ...value }
          : value,
      };
      onFiltersChange(newFilters);
      return newFilters;
    });
  };

  const clearAllFilters = () => {
    setFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const toggleSection = (section) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    });
  };

  const filterCollectionSm =
    "flex justify-end text-xs mobileLg:text-sm font-light text-stamp-grey-darker mt-1 mobileLg:mt-0 -mb-5 cursor-default";

  const [isDraggingPrice, setIsDraggingPrice] = useState(false);
  const [isDraggingRarity, setIsDraggingRarity] = useState(false);
  const [pendingPriceMin, setPendingPriceMin] = useState<string>("");
  const [pendingPriceMax, setPendingPriceMax] = useState<string>("");
  const [pendingRarityMin, setPendingRarityMin] = useState<string>("");
  const [pendingRarityMax, setPendingRarityMax] = useState<string>("");
  const drawerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
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
    window.addEventListener("mouseup", handleMouseUp);
    window.addEventListener("mouseleave", handleMouseUp);

    // Clean up
    return () => {
      window.removeEventListener("mouseup", handleMouseUp);
      window.removeEventListener("mouseleave", handleMouseUp);
    };
  }, [isDraggingPrice, isDraggingRarity]);

  const handlePriceRangeChange = (min: number, max: number) => {
    // Only update if values are defined
    if (min !== undefined && max !== undefined) {
      // Convert min to string, or empty string if it's 0
      const minStr = min === 0 ? "" : min.toString();

      // For max, if it's Infinity, use an empty string
      const maxStr = max === Infinity ? "" : max.toString();

      console.log("Price range changed:", { min, max, minStr, maxStr }); // Debug log

      // Directly update the filters state with the new values
      handleFilterChange("market", {
        ...filters.market,
        priceRange: {
          min: minStr,
          max: maxStr,
        },
      });
    }
  };

  const handleRarityRangeChange = (min: number, max: number) => {
    // Only update if values are defined
    if (min !== undefined && max !== undefined) {
      // Convert min to string, or empty string if it's 0
      const minStr = min === 0 ? "" : min.toString();

      // For max, if it's Infinity, use an empty string
      const maxStr = max === Infinity ? "" : max.toString();

      console.log("Rarity range changed:", { min, max, minStr, maxStr }); // Debug log

      // Directly update the filters state with the new values
      handleFilterChange("rarity", {
        ...filters.rarity,
        sub: false, // Disable the radio button when using custom range
        stampRange: {
          min: minStr,
          max: maxStr,
        },
      });
    }
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
          checked={filters.market.atomic}
          onChange={() =>
            handleFilterChange("market", {
              ...filters.market,
              atomic: !filters.market.atomic,
            })}
        />
        <Checkbox
          label="DISPENSERS"
          checked={filters.market.dispenser}
          onChange={() =>
            handleFilterChange("market", {
              ...filters.market,
              dispenser: !filters.market.dispenser,
            })}
        />
        <Checkbox
          label="LISTINGS"
          checked={filters.market.listings}
          onChange={() =>
            handleFilterChange("market", {
              ...filters.market,
              listings: !filters.market.listings,
            })}
        />
        <Checkbox
          label="SALES"
          checked={filters.market.sales}
          onChange={() =>
            handleFilterChange("market", {
              ...filters.market,
              sales: !filters.market.sales,
            })}
        />

        {/* Price Range Filter */}
        <CollapsibleSection
          title="PRICE RANGE"
          section="priceRange"
          expanded={expandedSections.priceRange}
          toggle={() => {
            // If already expanded, collapse and clear values
            if (expandedSections.priceRange) {
              handleFilterChange("market", {
                ...filters.market,
                priceRange: {
                  min: "",
                  max: "",
                },
              });
              setExpandedSections({
                ...expandedSections,
                priceRange: false,
              });
            } else {
              // Otherwise, expand but don't set any default values yet
              setExpandedSections({
                ...expandedSections,
                priceRange: true,
              });
            }
          }}
          variant="collapsibleSubTitle"
        >
          {expandedSections.priceRange && (
            <RangeSlider
              variant="price"
              onChange={handlePriceRangeChange}
            />
          )}
        </CollapsibleSection>
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
          checked={filters.fileType.jpg}
          onChange={() =>
            handleFilterChange("fileType", {
              ...filters.fileType,
              jpg: !filters.fileType.jpg,
            })}
        />

        <Checkbox
          key="png"
          label="PNG"
          checked={filters.fileType.png}
          onChange={() =>
            handleFilterChange("fileType", {
              ...filters.fileType,
              png: !filters.fileType.png,
            })}
        />
        <Checkbox
          key="gif"
          label="GIF"
          checked={filters.fileType.gif}
          onChange={() =>
            handleFilterChange("fileType", {
              ...filters.fileType,
              gif: !filters.fileType.gif,
            })}
        />
        <Checkbox
          key="webp"
          label="WEBP"
          checked={filters.fileType.webp}
          onChange={() =>
            handleFilterChange("fileType", {
              ...filters.fileType,
              webp: !filters.fileType.webp,
            })}
        />
        <Checkbox
          key="avif"
          label="AVIF"
          checked={filters.fileType.avif}
          onChange={() =>
            handleFilterChange("fileType", {
              ...filters.fileType,
              avif: !filters.fileType.avif,
            })}
        />
        <Checkbox
          key="bmp"
          label="BMP"
          checked={filters.fileType.bmp}
          onChange={() =>
            handleFilterChange("fileType", {
              ...filters.fileType,
              bmp: !filters.fileType.bmp,
            })}
        />

        {/* Category: VECTOR */}
        <div className={filterCollectionSm}>
          VECTOR
        </div>
        <Checkbox
          key="svg"
          label="SVG"
          checked={filters.fileType.svg}
          onChange={() =>
            handleFilterChange("fileType", {
              ...filters.fileType,
              svg: !filters.fileType.svg,
            })}
        />
        <Checkbox
          key="html"
          label="HTML"
          checked={filters.fileType.html}
          onChange={() =>
            handleFilterChange("fileType", {
              ...filters.fileType,
              html: !filters.fileType.html,
            })}
        />

        {/* Category: AUDIO */}
        <div className={filterCollectionSm}>
          AUDIO
        </div>
        <Checkbox
          key="mp3"
          label="MP3/MPEG"
          checked={filters.fileType.mp3}
          onChange={() =>
            handleFilterChange("fileType", {
              ...filters.fileType,
              mp3: !filters.fileType.mp3,
            })}
        />

        {/* Category: ENCODING */}
        <div className={filterCollectionSm}>
          ENCODING
        </div>
        <Checkbox
          key="legacy"
          label="LEGACY"
          checked={filters.fileType.legacy}
          onChange={() =>
            handleFilterChange("fileType", {
              ...filters.fileType,
              legacy: !filters.fileType.legacy,
            })}
        />
        <Checkbox
          key="olga"
          label="OLGA"
          checked={filters.fileType.olga}
          onChange={() =>
            handleFilterChange("fileType", {
              ...filters.fileType,
              olga: !filters.fileType.olga,
            })}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="EDITIONS"
        section="editions"
        expanded={expandedSections["editions"]}
        toggle={() => toggleSection("editions")}
        variant="collapsibleTitle"
      >
        <Checkbox
          label="1/1"
          checked={filters.editions.oneOfOne}
          onChange={() =>
            handleFilterChange("editions", {
              oneOfOne: !filters.editions.oneOfOne,
            })}
        />
        <Checkbox
          label="MULTIPLE"
          checked={filters.editions.multiple}
          onChange={() =>
            handleFilterChange("editions", {
              ...filters.editions,
              multiple: !filters.editions.multiple,
            })}
        />
        <Checkbox
          label="LOCKED"
          checked={filters.editions.locked}
          onChange={() =>
            handleFilterChange("editions", {
              locked: !filters.editions.locked,
            })}
        />
        <Checkbox
          label="UNLOCKED"
          checked={filters.editions.unlocked}
          onChange={() =>
            handleFilterChange("editions", {
              ...filters.editions,
              unlocked: !filters.editions.unlocked,
            })}
        />
        <Checkbox
          label="DIVISIBLE"
          checked={filters.editions.divisible}
          onChange={() =>
            handleFilterChange("editions", {
              ...filters.editions,
              divisible: !filters.editions.divisible,
            })}
        />
      </CollapsibleSection>

      <CollapsibleSection
        title="RARITY"
        section="rarity"
        expanded={expandedSections["rarity"]}
        toggle={() => toggleSection("rarity")}
        variant="collapsibleTitle"
      >
        {/* Standard Radio Buttons */}
        {[100, 1000, 5000, 10000].map((value) => (
          <Radio
            key={value}
            label={`< ${value}`}
            checked={filters.rarity?.sub === value.toString()}
            onChange={() => {
              if (filters.rarity?.sub === value.toString()) {
                handleFilterChange("rarity", {
                  sub: false,
                  stampRange: {
                    min: filters.rarity?.stampRange?.min || "",
                    max: filters.rarity?.stampRange?.max || "",
                  },
                });
              } else {
                // Select the radio button and clear stampRange
                handleFilterChange("rarity", {
                  sub: value.toString(),
                  stampRange: {
                    min: "", // Clear min
                    max: "", // Clear max
                  },
                });
              }
            }}
          />
        ))}

        {/* Custom Range Radio Button with Collapsible Section */}
        <Radio
          label="CUSTOM RANGE"
          checked={expandedSections.customRange}
          onChange={() => {
            // If already selected, deselect and clear values
            if (expandedSections.customRange) {
              handleFilterChange("rarity", {
                sub: false,
                stampRange: {
                  min: "",
                  max: "",
                },
              });
              setExpandedSections({
                ...expandedSections,
                customRange: false,
              });
            } else {
              // Otherwise, select it but don't set any default values yet
              handleFilterChange("rarity", {
                sub: false,
                stampRange: {
                  min: "",
                  max: "",
                },
              });
              setExpandedSections({
                ...expandedSections,
                customRange: true,
              });
            }
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
