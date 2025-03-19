import { useEffect, useRef, useState } from "preact/hooks";
import { STAMP_EDITIONS, STAMP_FILETYPES } from "$globals";

import {
  checkboxIcon,
  labelGreyBaseFilter,
} from "$islands/filter/FilterStyles.ts";
import {
  Checkbox,
  CollapsibleSection,
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
    single: false,
    multiple: false,
    locked: false,
    unlocked: false,
    divisible: false,
  },
  rarity: {
    sub: false as boolean | string,
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
  console.log(
    "Converting filters to query params:",
    JSON.stringify(filters, null, 2),
  );

  const queryParams = new URLSearchParams(search);

  // Extract selected filetypes into a flat parameter
  const selectedFiletypes = Object.entries(filters.fileType)
    .filter(([_, selected]) => selected)
    .map(([type]) => type);

  // Delete all existing fileType parameters (nested format)
  Array.from(queryParams.keys())
    .filter((key) => key.startsWith("fileType["))
    .forEach((key) => queryParams.delete(key));

  // Set the new flat filetype parameter if we have selections
  if (selectedFiletypes.length > 0) {
    queryParams.set("filetype", selectedFiletypes.join(","));
  } else {
    queryParams.delete("filetype");
  }

  // Process all other filter categories - KEEP THIS ORIGINAL CODE UNTOUCHED
  Object.entries(filters).forEach(([category, value]) => {
    // Skip fileType category as we've handled it separately
    if (category === "fileType") return;

    // THIS IS THE ORIGINAL CODE - keep this exactly as it was
    if (typeof value !== null && typeof value === "object") {
      Object.entries(value).forEach(([key, val]) => {
        // Handle rarity parameters
        if (category === "rarity") {
          // If we have stampRange values, ignore sub
          if (key === "stampRange") {
            // Always clean up stampRange parameters first
            queryParams.delete(`${category}[${key}][min]`);
            queryParams.delete(`${category}[${key}][max]`);

            console.log("Rarity range values:", JSON.stringify(val, null, 2));

            // Add type guard to ensure val has min and max properties
            if (
              val && typeof val === "object" && "min" in val && "max" in val
            ) {
              // Only add min parameter if it has a non-empty value
              if (val.min !== undefined && val.min !== null && val.min !== "") {
                console.log(`Adding ${category}[${key}][min]=${val.min}`);
                queryParams.append(
                  `${category}[${key}][min]`,
                  val.min.toString(),
                );
              }

              // Only add max parameter if it has a non-empty value
              if (val.max !== undefined && val.max !== null && val.max !== "") {
                console.log(`Adding ${category}[${key}][max]=${val.max}`);
                queryParams.append(
                  `${category}[${key}][max]`,
                  val.max.toString(),
                );
              }
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

          console.log("Price range values:", JSON.stringify(val, null, 2));

          // Add type guard to ensure val has min and max properties
          if (val && typeof val === "object" && "min" in val && "max" in val) {
            // Only add min parameter if it has a non-empty value
            if (val.min !== undefined && val.min !== null && val.min !== "") {
              console.log(`Adding min to URL: ${val.min}`);
              queryParams.append(
                `${category}[${key}][min]`,
                val.min.toString(),
              );
            }

            // Only add max parameter if it has a non-empty value
            if (val.max !== undefined && val.max !== null && val.max !== "") {
              console.log(`Adding max to URL: ${val.max}`);
              queryParams.append(
                `${category}[${key}][max]`,
                val.max.toString(),
              );
            }
          }

          return;
        }

        // Before trying to call toString(), check the type of val
        if (val !== null && val !== undefined) {
          const strVal = val.toString();

          if (typeof val === "boolean") {
            if (strVal !== "false") {
              queryParams.set(`${category}[${key}]`, strVal);
            } else {
              queryParams.delete(`${category}[${key}]`);
            }
          } else if (typeof val === "object") {
            // Skip objects as they're handled in the specific conditions above
            // This prevents trying to compare an object with an empty string
          } else if (val !== "") {
            queryParams.set(`${category}[${key}]`, strVal);
          }
        }
      });
    }
  });

  const result = queryParams.toString();
  console.log("Final query params:", result);
  return result;
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
  if (filters.fileType.jpg) {
    filterPayload.pixel.filetypeFilters.push("jpg");
    filterPayload.pixel.filetypeFilters.push("jpeg");
  }

  // PNG
  if (filters.fileType.png) {
    filterPayload.pixel.filetypeFilters.push("png");
  }

  // GIF
  if (filters.fileType.gif) {
    filterPayload.pixel.filetypeFilters.push("gif");
  }

  // WEBP
  if (filters.fileType.webp) {
    filterPayload.pixel.filetypeFilters.push("webp");
  }

  // AVIF
  if (filters.fileType.avif) {
    filterPayload.pixel.filetypeFilters.push("avif");
  }

  // BMP
  if (filters.fileType.bmp) {
    filterPayload.pixel.filetypeFilters.push("bmp");
  }

  // MP3/MPEG (combined)
  if (filters.fileType.mp3) {
    filterPayload.audio.filetypeFilters.push("mp3");
    filterPayload.audio.filetypeFilters.push("mpeg");
  }

  // SVG
  if (filters.fileType.svg) {
    filterPayload.vector.filetypeFilters.push("svg");
    filterPayload.recursive.filetypeFilters.push("svg");
  }

  // HTML
  if (filters.fileType.html) {
    filterPayload.vector.filetypeFilters.push("html");
    filterPayload.recursive.filetypeFilters.push("html");
  }

  // LEGACY
  if (filters.fileType.legacy) {
    filterPayload.encoding.filetypeFilters.push("legacy");
  }

  // OLGA
  if (filters.fileType.olga) {
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
  if (filters.editions.single) editionFilters.push("single");
  if (filters.editions.multiple) editionFilters.push("multiple");
  if (filters.editions.locked) editionFilters.push("locked");
  if (filters.editions.unlocked) editionFilters.push("unlocked");
  if (filters.editions.divisible) editionFilters.push("divisible");

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
  // Market filters
  "market[atomic]",
  "market[dispenser]",
  "market[listings]",
  "market[sales]",
  "market[priceRange][min]",
  "market[priceRange][max]",

  // File type filters
  "filetype",

  // Editions filters
  "editions[single]",
  "editions[multiple]",
  "editions[locked]",
  "editions[unlocked]",
  "editions[divisible]",

  // Rarity filters
  "rarity[sub]",
  "rarity[stampRange][min]",
  "rarity[stampRange][max]",
];

export function queryParamsToFilters(query: string): StampFilters {
  const params = new URLSearchParams(query);
  // Initialize with default filters
  const filters = { ...defaultFilters };

  // ONLY handle flat filetype parameter
  const flatFiletype = params.get("filetype");
  if (flatFiletype) {
    const filetypeValues = flatFiletype.split(",");

    // Set selected filetypes to true
    filetypeValues.forEach((type) => {
      if (type in filters.fileType) {
        filters.fileType[type] = true;
      }
    });
  }
  // END NEW SECTION - DO NOT MODIFY ANYTHING BELOW THIS POINT

  // Parse market params
  if (params.get("market[atomic]") === "true") {
    filters.market.atomic = true;
  }
  if (params.get("market[dispenser]") === "true") {
    filters.market.dispenser = true;
  }
  if (params.get("market[listings]") === "true") {
    filters.market.listings = true;
  }
  if (params.get("market[sales]") === "true") {
    filters.market.sales = true;
  }

  // Parse price range params
  const minPriceParam = params.get("market[priceRange][min]");
  if (minPriceParam) {
    filters.market.priceRange.min = minPriceParam;
  }
  const maxPriceParam = params.get("market[priceRange][max]");
  if (maxPriceParam) {
    filters.market.priceRange.max = maxPriceParam;
  }

  // Parse rarity params
  const raritySubParam = params.get("rarity[sub]");
  if (raritySubParam) {
    filters.rarity.sub = raritySubParam === "true" ? true : raritySubParam;
  }

  // Parse rarity range params
  const rarityMinParam = params.get("rarity[stampRange][min]");
  if (rarityMinParam) {
    filters.rarity.stampRange.min = rarityMinParam;
  }
  const rarityMaxParam = params.get("rarity[stampRange][max]");
  if (rarityMaxParam) {
    filters.rarity.stampRange.max = rarityMaxParam;
  }

  // Parse editions params
  if (params.get("editions[single]") === "true") {
    filters.editions.single = true;
  }
  if (params.get("editions[multiple]") === "true") {
    filters.editions.multiple = true;
  }
  if (params.get("editions[locked]") === "true") {
    filters.editions.locked = true;
  }
  if (params.get("editions[unlocked]") === "true") {
    filters.editions.unlocked = true;
  }
  if (params.get("editions[divisible]") === "true") {
    filters.editions.divisible = true;
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
function hasActiveFilters(section: string, filters: typeof defaultFilters) {
  switch (section) {
    case "fileType":
      // Check if the fileType array has any items
      return filters.fileType.length > 0;

    case "editions":
      // Check if the editions array has any items
      return filters.editions.length > 0;

    case "rarity":
      // Check if either preset is set or min/max values exist
      return filters.rarity.preset !== null ||
        filters.rarity.min !== "" ||
        filters.rarity.max !== "";

    case "market":
      return filters.market.atomic ||
        filters.market.dispenser ||
        filters.market.listings ||
        filters.market.sales ||
        filters.market.priceRange.min !== "" ||
        filters.market.priceRange.max !== "";

    case "customRange": // For rarity custom range subsection
      return filters.rarity.min !== "" || filters.rarity.max !== "";

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
        [category]: typeof value === "object"
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
          // Transitional structure
          sub: "stamp range",
          stampRange: {
            min: min.toString(),
            max: max === Infinity ? "" : max.toString(),
          },
        },
      };

      // Important: update parent component state
      onFiltersChange(newFilters);
      return newFilters;
    });
  };

  // Fix: Add a dedicated file type toggle function
  const toggleFileType = (type: string) => {
    setFilters((prevFilters) => {
      // Make a copy of the fileType array
      const newFileTypes = [...prevFilters.fileType];

      if (newFileTypes.includes(type)) {
        // Remove if already present
        const index = newFileTypes.indexOf(type);
        newFileTypes.splice(index, 1);
      } else {
        // Add if not present
        newFileTypes.push(type);
      }

      const newFilters = {
        ...prevFilters,
        fileType: newFileTypes,
      };

      // Important: Call onFiltersChange to update parent state
      onFiltersChange(newFilters);
      return newFilters;
    });
  };

  // Fix: Add a dedicated editions toggle function
  const toggleEdition = (type: string) => {
    setFilters((prevFilters) => {
      // Make a copy of the editions array
      const newEditions = [...prevFilters.editions];

      if (newEditions.includes(type)) {
        // Remove if already present
        const index = newEditions.indexOf(type);
        newEditions.splice(index, 1);
      } else {
        // Add if not present
        newEditions.push(type);
      }

      const newFilters = {
        ...prevFilters,
        editions: newEditions,
      };

      // Important: Call onFiltersChange to update parent state
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
        {(filters.market.atomic || filters.market.dispenser ||
          filters.market.listings || filters.market.sales) && (
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
          checked={(filters.rarity.preset === null &&
            filters.rarity.sub === "stamp range") ||
            (filters.rarity.min !== "" || filters.rarity.max !== "") ||
            (filters.rarity.stampRange &&
              (filters.rarity.stampRange.min !== "" ||
                filters.rarity.stampRange.max !== ""))}
          onChange={() => {
            // Toggle custom range selection
            if (
              (filters.rarity.preset === null &&
                filters.rarity.sub === "stamp range") ||
              (filters.rarity.min !== "" || filters.rarity.max !== "") ||
              (filters.rarity.stampRange &&
                (filters.rarity.stampRange.min !== "" ||
                  filters.rarity.stampRange.max !== ""))
            ) {
              // Deselect custom range
              handleFilterChange("rarity", {
                preset: null,
                min: "",
                max: "",
                sub: false,
                stampRange: {
                  min: "",
                  max: "",
                },
              });
            } else {
              // Select custom range
              handleFilterChange("rarity", {
                preset: null,
                min: "",
                max: "",
                sub: "stamp range",
                stampRange: {
                  min: "",
                  max: "",
                },
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
