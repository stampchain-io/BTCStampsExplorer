import { useEffect, useRef, useState } from "preact/hooks";
import { SRC20Filters } from "$islands/filter/FilterOptionsSRC20.tsx";
import { useDebouncedCallback } from "$lib/utils/filterUtils.ts";
import {
  CollapsibleSection,
  Radiobutton,
  RangeButtons,
  RangeSlider,
} from "$islands/filter/FilterComponents.tsx";

// Helper function to check if a section has active filters
function hasActiveFilters(section: string, filters: SRC20Filters) {
  switch (section) {
    case "market":
      return filters.market.marketcap ||
        filters.market.volume ||
        filters.market.priceChange;
    case "details":
      return filters.details.deploy ||
        filters.details.supply ||
        filters.details.holders;
    case "mint":
      return filters.mint.fullyminted ||
        filters.mint.minting ||
        filters.mint.trendingMints;
    default:
      return false;
  }
}

export const FilterContentSRC20 = ({
  initialFilters,
  onFiltersChange,
}: {
  initialFilters: SRC20Filters;
  onFiltersChange: (filters: SRC20Filters) => void;
}) => {
  const [filters, setFilters] = useState(initialFilters);
  const [volumePeriod, setVolumePeriod] = useState("24h");
  const [priceChangePeriod, setPriceChangePeriod] = useState("24h");

  // Add this effect to watch for changes to initialFilters
  useEffect(() => {
    setFilters(initialFilters);
  }, [initialFilters]);

  const [expandedSections, setExpandedSections] = useState({
    mint: true,
    market: hasActiveFilters("market", filters),
    details: hasActiveFilters("details", filters),
    holdersRange: false,
    volumePeriod: false,
    priceChangePeriod: false,
  });

  const debouncedOnFilterChange = useDebouncedCallback(
    (str: string) => {
      globalThis.location.href = globalThis.location.pathname + "?" +
        str;
    },
    500,
  );

  const handleFilterChange = (
    category: string,
    key: string,
    value: boolean,
  ) => {
    setFilters((prevFilters) => {
      const newFilters = {
        ...prevFilters,
        [category]: {
          ...prevFilters[category],
          [key]: value,
        },
      };
      onFiltersChange(newFilters);
      return newFilters;
    });
  };

  const toggleSection = (section: string) => {
    setExpandedSections({
      ...expandedSections,
      [section]: !expandedSections[section],
    });
  };

  const handleHoldersRangeChange = (min: number, max: number) => {
    // This would update the holders range in the actual implementation
    console.log(`Holders range changed: ${min} - ${max}`);
  };

  // Update the handleStatusChange function to allow deselection
  const handleStatusChange = (
    status: "fullyminted" | "minting" | "trendingMints",
  ) => {
    setFilters((prevFilters) => {
      const newFilters = {
        ...prevFilters,
        mint: {
          ...prevFilters.mint,
          fullyminted: prevFilters.mint.fullyminted === true
            ? false
            : status === "fullyminted",
          minting: prevFilters.mint.minting === true
            ? false
            : status === "minting",
          trendingMints: prevFilters.mint.trendingMints === true
            ? false
            : status === "trendingMints",
        },
      };
      onFiltersChange(newFilters);
      return newFilters;
    });
  };

  // Modify the handler functions to handle the combined Details + Market group
  const handleDetailsAndMarketChange = (
    category: "details" | "market",
    option: string,
  ) => {
    setFilters((prevFilters) => {
      const newFilters = {
        ...prevFilters,
        details: {
          ...prevFilters.details,
          deploy: category === "details" && option === "deploy"
            ? (prevFilters.details.deploy === true ? false : true)
            : false,
          supply: category === "details" && option === "supply"
            ? (prevFilters.details.supply === true ? false : true)
            : false,
          holders: category === "details" && option === "holders"
            ? (prevFilters.details.holders === true ? false : true)
            : false,
        },
        market: {
          ...prevFilters.market,
          marketcap: category === "market" && option === "marketcap"
            ? (prevFilters.market.marketcap === true ? false : true)
            : false,
          volume: category === "market" && option === "volume"
            ? (prevFilters.market.volume === true ? false : true)
            : false,
          priceChange: category === "market" && option === "priceChange"
            ? (prevFilters.market.priceChange === true ? false : true)
            : false,
        },
      };
      onFiltersChange(newFilters);
      return newFilters;
    });
  };

  return (
    <div className="space-y-1.5 tablet:space-y-1">
      {/* STATUS SECTION - Independent group */}
      <CollapsibleSection
        title="STATUS"
        section="mint"
        expanded={expandedSections.mint}
        toggle={() => toggleSection("mint")}
        variant="collapsibleTitle"
      >
        <Radiobutton
          label="FULLY MINTED"
          value="fullyminted"
          checked={filters.mint.fullyminted}
          onChange={() => handleStatusChange("fullyminted")}
          name="status"
        />

        <Radiobutton
          label="MINTING"
          value="minting"
          checked={filters.mint.minting}
          onChange={() => handleStatusChange("minting")}
          name="status"
        />

        <Radiobutton
          label="TRENDING MINTS"
          value="trendingMints"
          checked={filters.mint.trendingMints}
          onChange={() => handleStatusChange("trendingMints")}
          name="status"
        />
      </CollapsibleSection>

      {/* SPECIFICATIONS SECTION - Part of combined group */}
      <CollapsibleSection
        title="DETAILS"
        section="details"
        expanded={expandedSections.details}
        toggle={() => toggleSection("details")}
        variant="collapsibleTitle"
      >
        <Radiobutton
          label="DEPLOY DATE"
          value="deploy"
          checked={filters.details.deploy}
          onChange={() => handleDetailsAndMarketChange("details", "deploy")}
          name="specsAndMarket"
        />

        <Radiobutton
          label="SUPPLY"
          value="supply"
          checked={filters.details.supply}
          onChange={() => handleDetailsAndMarketChange("details", "supply")}
          name="specsAndMarket"
        />

        <Radiobutton
          label="HOLDERS"
          value="holders"
          checked={filters.details.holders}
          onChange={() => handleDetailsAndMarketChange("details", "holders")}
          name="specsAndMarket"
        />

        {filters.details.holders && (
          <CollapsibleSection
            title=""
            section="holdersRange"
            expanded={true}
            toggle={() => {}}
            variant="collapsibleLabel"
          >
            <RangeSlider
              variant="holders"
              onChange={handleHoldersRangeChange}
            />
          </CollapsibleSection>
        )}
      </CollapsibleSection>

      {/* MARKET SECTION - Part of combined group */}
      <CollapsibleSection
        title="MARKET"
        section="market"
        expanded={expandedSections.market}
        toggle={() => toggleSection("market")}
        variant="collapsibleTitle"
      >
        <Radiobutton
          label="MARKET CAP"
          value="marketcap"
          checked={filters.market.marketcap}
          onChange={() => handleDetailsAndMarketChange("market", "marketcap")}
          name="specsAndMarket"
        />

        <Radiobutton
          label="VOLUME"
          value="volume"
          checked={filters.market.volume}
          onChange={() => handleDetailsAndMarketChange("market", "volume")}
          name="specsAndMarket"
        />

        <Radiobutton
          label="PRICE CHANGE"
          value="priceChange"
          checked={filters.market.priceChange}
          onChange={() => handleDetailsAndMarketChange("market", "priceChange")}
          name="specsAndMarket"
        />

        {/* Wrap VOLUME time period buttons in CollapsibleSection */}
        {filters.market.volume && (
          <CollapsibleSection
            title=""
            section="volumePeriod"
            expanded={true}
            toggle={() => {}}
            variant="collapsibleLabel"
          >
            <RangeButtons
              selected={volumePeriod}
              onChange={setVolumePeriod}
            />
          </CollapsibleSection>
        )}

        {/* Wrap PRICE CHANGE time period buttons in CollapsibleSection */}
        {filters.market.priceChange && (
          <CollapsibleSection
            title=""
            section="priceChangePeriod"
            expanded={true}
            toggle={() => {}}
            variant="collapsibleLabel"
          >
            <RangeButtons
              selected={priceChangePeriod}
              onChange={setPriceChangePeriod}
            />
          </CollapsibleSection>
        )}
      </CollapsibleSection>
    </div>
  );
};

export default FilterContentSRC20;
