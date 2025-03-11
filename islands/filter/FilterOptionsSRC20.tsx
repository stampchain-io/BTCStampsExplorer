import { SRC20_FILTER_TYPES } from "$globals";

// Define a type for the SRC20 filters object
export type SRC20Filters = {
  market: {
    marketcap: {
      min: string;
      max: string;
    };
    volume: {
      min: string;
      max: string;
    };
    priceChange: {
      period: "24h" | "7d" | "";
      direction: "up" | "down" | "";
      percentage: string;
    };
  };
  details: {
    deploy: {
      from: string; // Date string
      to: string; // Date string
    };
    supply: {
      min: string;
      max: string;
    };
    holders: {
      min: string;
      max: string;
    };
  };
  mint: {
    minting: boolean;
    trendingMints: boolean;
    mintProgress: {
      min: string;
      max: string;
    };
  };
  [key: string]: any; // Add index signature to allow string indexing
};

// Default filters for SRC20
export const defaultFilters: SRC20Filters = {
  market: {
    marketcap: {
      min: "",
      max: "",
    },
    volume: {
      min: "",
      max: "",
    },
    priceChange: {
      period: "",
      direction: "",
      percentage: "",
    },
  },
  details: {
    deploy: {
      from: "",
      to: "",
    },
    supply: {
      min: "",
      max: "",
    },
    holders: {
      min: "",
      max: "",
    },
  },
  mint: {
    minting: false,
    trendingMints: false,
    mintProgress: {
      min: "",
      max: "",
    },
  },
};

export function filtersToQueryParams(
  search: string,
  filters: SRC20Filters,
): string {
  const queryParams = new URLSearchParams(search);

  // Process market filters
  if (filters.market.marketcap.min) {
    queryParams.set("market[marketcap][min]", filters.market.marketcap.min);
  } else {
    queryParams.delete("market[marketcap][min]");
  }

  if (filters.market.marketcap.max) {
    queryParams.set("market[marketcap][max]", filters.market.marketcap.max);
  } else {
    queryParams.delete("market[marketcap][max]");
  }

  if (filters.market.volume.min) {
    queryParams.set("market[volume][min]", filters.market.volume.min);
  } else {
    queryParams.delete("market[volume][min]");
  }

  if (filters.market.volume.max) {
    queryParams.set("market[volume][max]", filters.market.volume.max);
  } else {
    queryParams.delete("market[volume][max]");
  }

  if (filters.market.priceChange.period) {
    queryParams.set(
      "market[priceChange][period]",
      filters.market.priceChange.period,
    );
  } else {
    queryParams.delete("market[priceChange][period]");
  }

  if (filters.market.priceChange.direction) {
    queryParams.set(
      "market[priceChange][direction]",
      filters.market.priceChange.direction,
    );
  } else {
    queryParams.delete("market[priceChange][direction]");
  }

  if (filters.market.priceChange.percentage) {
    queryParams.set(
      "market[priceChange][percentage]",
      filters.market.priceChange.percentage,
    );
  } else {
    queryParams.delete("market[priceChange][percentage]");
  }

  // Process details filters
  if (filters.details.deploy.from) {
    queryParams.set("details[deploy][from]", filters.details.deploy.from);
  } else {
    queryParams.delete("details[deploy][from]");
  }

  if (filters.details.deploy.to) {
    queryParams.set("details[deploy][to]", filters.details.deploy.to);
  } else {
    queryParams.delete("details[deploy][to]");
  }

  if (filters.details.supply.min) {
    queryParams.set("details[supply][min]", filters.details.supply.min);
  } else {
    queryParams.delete("details[supply][min]");
  }

  if (filters.details.supply.max) {
    queryParams.set("details[supply][max]", filters.details.supply.max);
  } else {
    queryParams.delete("details[supply][max]");
  }

  if (filters.details.holders.min) {
    queryParams.set("details[holders][min]", filters.details.holders.min);
  } else {
    queryParams.delete("details[holders][min]");
  }

  if (filters.details.holders.max) {
    queryParams.set("details[holders][max]", filters.details.holders.max);
  } else {
    queryParams.delete("details[holders][max]");
  }

  // Process mint filters
  if (filters.mint.minting) {
    queryParams.set("mint[minting]", "true");
  } else {
    queryParams.delete("mint[minting]");
  }

  if (filters.mint.trendingMints) {
    queryParams.set("mint[trendingMints]", "true");
  } else {
    queryParams.delete("mint[trendingMints]");
  }

  if (filters.mint.mintProgress.min) {
    queryParams.set("mint[mintProgress][min]", filters.mint.mintProgress.min);
  } else {
    queryParams.delete("mint[mintProgress][min]");
  }

  if (filters.mint.mintProgress.max) {
    queryParams.set("mint[mintProgress][max]", filters.mint.mintProgress.max);
  } else {
    queryParams.delete("mint[mintProgress][max]");
  }

  return queryParams.toString();
}

export function queryParamsToFilters(query: string): SRC20Filters {
  const params = new URLSearchParams(query);
  const filters = { ...defaultFilters };

  // Parse market filters
  const marketcapMin = params.get("market[marketcap][min]");
  if (marketcapMin) {
    filters.market.marketcap.min = marketcapMin;
  }

  const marketcapMax = params.get("market[marketcap][max]");
  if (marketcapMax) {
    filters.market.marketcap.max = marketcapMax;
  }

  const volumeMin = params.get("market[volume][min]");
  if (volumeMin) {
    filters.market.volume.min = volumeMin;
  }

  const volumeMax = params.get("market[volume][max]");
  if (volumeMax) {
    filters.market.volume.max = volumeMax;
  }

  const priceChangePeriod = params.get("market[priceChange][period]") as
    | "24h"
    | "7d"
    | "";
  if (priceChangePeriod) {
    filters.market.priceChange.period = priceChangePeriod;
  }

  const priceChangeDirection = params.get("market[priceChange][direction]") as
    | "up"
    | "down"
    | "";
  if (priceChangeDirection) {
    filters.market.priceChange.direction = priceChangeDirection;
  }

  const priceChangePercentage = params.get("market[priceChange][percentage]");
  if (priceChangePercentage) {
    filters.market.priceChange.percentage = priceChangePercentage;
  }

  // Parse details filters
  const deployFrom = params.get("details[deploy][from]");
  if (deployFrom) {
    filters.details.deploy.from = deployFrom;
  }

  const deployTo = params.get("details[deploy][to]");
  if (deployTo) {
    filters.details.deploy.to = deployTo;
  }

  const supplyMin = params.get("details[supply][min]");
  if (supplyMin) {
    filters.details.supply.min = supplyMin;
  }

  const supplyMax = params.get("details[supply][max]");
  if (supplyMax) {
    filters.details.supply.max = supplyMax;
  }

  const holdersMin = params.get("details[holders][min]");
  if (holdersMin) {
    filters.details.holders.min = holdersMin;
  }

  const holdersMax = params.get("details[holders][max]");
  if (holdersMax) {
    filters.details.holders.max = holdersMax;
  }

  // Parse mint filters
  const minting = params.get("mint[minting]");
  if (minting === "true") {
    filters.mint.minting = true;
  }

  const trendingMints = params.get("mint[trendingMints]");
  if (trendingMints === "true") {
    filters.mint.trendingMints = true;
  }

  const mintProgressMin = params.get("mint[mintProgress][min]");
  if (mintProgressMin) {
    filters.mint.mintProgress.min = mintProgressMin;
  }

  const mintProgressMax = params.get("mint[mintProgress][max]");
  if (mintProgressMax) {
    filters.mint.mintProgress.max = mintProgressMax;
  }

  return filters;
}

export const allQueryKeysFromFiltersSRC20 = [
  // Market filters
  "market[marketcap][min]",
  "market[marketcap][max]",
  "market[volume][min]",
  "market[volume][max]",
  "market[priceChange][period]",
  "market[priceChange][direction]",
  "market[priceChange][percentage]",

  // Details filters
  "details[deploy][from]",
  "details[deploy][to]",
  "details[supply][min]",
  "details[supply][max]",
  "details[holders][min]",
  "details[holders][max]",

  // Mint filters
  "mint[minting]",
  "mint[trendingMints]",
  "mint[mintProgress][min]",
  "mint[mintProgress][max]",
];
