import { _SRC20_FILTER_TYPES } from "$globals";

// Define a type for the SRC20 filters object
export type SRC20Filters = {
  status: {
    fullyMinted: boolean;
    minting: boolean;
    trendingMints: boolean;
  };
  details: {
    deploy: boolean;
    supply: boolean;
    holders: boolean;
    holdersRange?: {
      min: number;
      max: number;
    };
  };
  market: {
    marketcap: boolean;
    volume: boolean;
    volumePeriod?: "24h" | "3d" | "7d";
    priceChange: boolean;
    priceChangePeriod?: "24h" | "3d" | "7d";
  };
  [key: string]: any; // Add index signature to allow string indexing
};

// Default filters for SRC20
export const defaultFilters: SRC20Filters = {
  market: {
    marketcap: false,
    volume: false,
    volumePeriod: "24h",
    priceChange: false,
    priceChangePeriod: "24h",
  },
  details: {
    deploy: false,
    supply: false,
    holders: false,
    holdersRange: {
      min: 0,
      max: 10000,
    },
  },
  status: {
    fullyMinted: false,
    minting: false,
    trendingMints: false,
  },
};

export function filtersToQueryParams(
  search: string,
  filters: SRC20Filters,
): string {
  const queryParams = new URLSearchParams(search);

  // Process market filters
  if (filters.market.marketcap) {
    queryParams.set("market[marketcap]", "true");
  } else {
    queryParams.delete("market[marketcap]");
  }

  if (filters.market.volume) {
    queryParams.set("market[volume]", "true");
    if (filters.market.volumePeriod) {
      queryParams.set("market[volumePeriod]", filters.market.volumePeriod);
    }
  } else {
    queryParams.delete("market[volume]");
    queryParams.delete("market[volumePeriod]");
  }

  if (filters.market.priceChange) {
    queryParams.set("market[priceChange]", "true");
    if (filters.market.priceChangePeriod) {
      queryParams.set(
        "market[priceChangePeriod]",
        filters.market.priceChangePeriod,
      );
    }
  } else {
    queryParams.delete("market[priceChange]");
    queryParams.delete("market[priceChangePeriod]");
  }

  // Process details filters
  if (filters.details.deploy) {
    queryParams.set("details[deploy]", "true");
  } else {
    queryParams.delete("details[deploy]");
  }

  if (filters.details.supply) {
    queryParams.set("details[supply]", "true");
  } else {
    queryParams.delete("details[supply]");
  }

  if (filters.details.holders) {
    queryParams.set("details[holders]", "true");
    if (filters.details.holdersRange) {
      if (filters.details.holdersRange.min !== 0) {
        queryParams.set(
          "details[holdersRange][min]",
          filters.details.holdersRange.min.toString(),
        );
      } else {
        queryParams.delete("details[holdersRange][min]");
      }

      if (filters.details.holdersRange.max !== 10000) {
        queryParams.set(
          "details[holdersRange][max]",
          filters.details.holdersRange.max.toString(),
        );
      } else {
        queryParams.delete("details[holdersRange][max]");
      }
    }
  } else {
    queryParams.delete("details[holders]");
    queryParams.delete("details[holdersRange][min]");
    queryParams.delete("details[holdersRange][max]");
  }

  // Process status filters
  if (filters.status.fullyMinted) {
    queryParams.set("status[fullyMinted]", "true");
  } else {
    queryParams.delete("status[fullyMinted]");
  }

  if (filters.status.minting) {
    queryParams.set("status[minting]", "true");
  } else {
    queryParams.delete("status[minting]");
  }

  if (filters.status.trendingMints) {
    queryParams.set("status[trendingMints]", "true");
  } else {
    queryParams.delete("status[trendingMints]");
  }

  return queryParams.toString();
}

export function queryParamsToFilters(query: string): SRC20Filters {
  const params = new URLSearchParams(query);
  console.log("SRC20 queryParamsToFilters - URL params:", query);
  const filters = { ...defaultFilters };

  // Parse market filters
  if (params.get("market[marketcap]") === "true") {
    filters.market.marketcap = true;
  }

  if (params.get("market[volume]") === "true") {
    filters.market.volume = true;
    const volumePeriod = params.get("market[volumePeriod]") as
      | "24h"
      | "3d"
      | "7d"
      | null;
    if (volumePeriod) {
      filters.market.volumePeriod = volumePeriod;
    }
  }

  if (params.get("market[priceChange]") === "true") {
    filters.market.priceChange = true;
    const priceChangePeriod = params.get("market[priceChangePeriod]") as
      | "24h"
      | "3d"
      | "7d"
      | null;
    if (priceChangePeriod) {
      filters.market.priceChangePeriod = priceChangePeriod;
    }
  }

  // Parse details filters
  if (params.get("details[deploy]") === "true") {
    filters.details.deploy = true;
  }

  if (params.get("details[supply]") === "true") {
    filters.details.supply = true;
  }

  if (params.get("details[holders]") === "true") {
    filters.details.holders = true;
    const holdersRangeMin = params.get("details[holdersRange][min]");
    const holdersRangeMax = params.get("details[holdersRange][max]");

    if (holdersRangeMin && holdersRangeMax) {
      filters.details.holdersRange = {
        min: parseInt(holdersRangeMin, 10),
        max: parseInt(holdersRangeMax, 10),
      };
    }
  }

  // Parse status filters
  console.log(
    "Checking status[fullyMinted]:",
    params.get("status[fullyMinted]"),
  );
  if (params.get("status[fullyMinted]") === "true") {
    filters.status.fullyMinted = true;
    console.log("Setting status.fullyMinted to true");
  }

  console.log("Checking status[minting]:", params.get("status[minting]"));
  if (params.get("status[minting]") === "true") {
    filters.status.minting = true;
    console.log("Setting status.minting to true");
  }

  console.log(
    "Checking status[trendingMints]:",
    params.get("status[trendingMints]"),
  );
  if (params.get("status[trendingMints]") === "true") {
    filters.status.trendingMints = true;
    console.log("Setting status.trendingMints to true");
  }

  console.log("Final SRC20 filters:", filters);
  return filters;
}

export const allQueryKeysFromFiltersSRC20 = [
  // Status filters
  "status[fullyMinted]",
  "status[minting]",
  "status[trendingMints]",

  // Details filters
  "details[deploy]",
  "details[supply]",
  "details[holders]",
  "details[holdersRange][min]",
  "details[holdersRange][max]",

  // Market filters
  "market[marketcap]",
  "market[volume]",
  "market[volumePeriod]",
  "market[priceChange]",
  "market[priceChangePeriod]",
];
