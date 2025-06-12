import { formatSatoshisToBTC, formatUSDValue } from "$lib/utils/formatUtils.ts";
import {
  BlockCypherAddressBalanceResponse,
  BTCBalance,
  BTCBalanceInfo,
  BTCBalanceInfoOptions,
} from "$lib/types/index.d.ts";
import { BLOCKCYPHER_API_BASE_URL } from "$lib/utils/constants.ts";
import { getBTCBalanceFromMempool } from "$lib/utils/mempool.ts";

/**
 * @deprecated Use BTCPriceService.getPrice() for server-side or /api/internal/btcPrice for client-side
 * Fetch BTC price in USD using the centralized Redis-cached endpoint
 * This function is kept for backward compatibility but should be migrated to BTCPriceService
 */
export async function fetchBTCPriceInUSD(apiBaseUrl?: string): Promise<number> {
  console.warn(
    "fetchBTCPriceInUSD is deprecated. Use BTCPriceService.getPrice() or /api/internal/btcPrice",
  );

  const requestId = `btc-price-${Date.now()}-${
    Math.random().toString(36).substr(2, 9)
  }`;

  console.log(
    `[${requestId}] Fetching BTC price from centralized endpoint, apiBaseUrl: ${
      apiBaseUrl || "none"
    }`,
  );

  // Fallback implementation for compatibility
  if (typeof window !== "undefined" || !apiBaseUrl) {
    // Client-side or no baseUrl: use centralized endpoint
    try {
      const baseUrl = apiBaseUrl ||
        (typeof window !== "undefined"
          ? globalThis.location.origin
          : "http://localhost:8000");
      const response = await fetch(`${baseUrl}/api/internal/btcPrice`);
      if (response.ok) {
        const data = await response.json();
        const price = formatUSDValue(data.data?.price || 0);
        console.log(
          `[${requestId}] BTC price from centralized endpoint: $${price}`,
        );
        return price;
      }
    } catch (error) {
      console.error(`[${requestId}] Error fetching BTC price:`, error);
    }
    return 0;
  } else {
    // Server-side with baseUrl: use service directly (requires dynamic import to avoid circular dependency)
    try {
      const { BTCPriceService } = await import(
        "$server/services/price/btcPriceService.ts"
      );
      const btcPriceData = await BTCPriceService.getPrice();
      const price = formatUSDValue(btcPriceData.price);
      console.log(
        `[${requestId}] BTC price from BTCPriceService: $${price} from ${btcPriceData.source}`,
      );
      return price;
    } catch (error) {
      console.error(
        `[${requestId}] Error fetching BTC price from BTCPriceService:`,
        error,
      );
      return 0;
    }
  }
}

async function getBTCBalanceFromBlockCypher(
  address: string,
): Promise<BTCBalance | null> {
  try {
    const response = await fetch(
      `${BLOCKCYPHER_API_BASE_URL}/v1/btc/main/addrs/${address}/balance`,
    );
    if (!response.ok) return null;

    const data = await response.json() as BlockCypherAddressBalanceResponse;
    const confirmed = data.balance || 0;
    const unconfirmed = data.unconfirmed_balance || 0;

    return {
      confirmed,
      unconfirmed,
      total: confirmed + unconfirmed,
      txCount: data.n_tx || 0,
      unconfirmedTxCount: data.unconfirmed_n_tx || 0,
    };
  } catch (error) {
    console.error("BlockCypher balance fetch error:", error);
    return null;
  }
}

export async function getBTCBalanceInfo(
  address: string,
  options: BTCBalanceInfoOptions = {},
): Promise<BTCBalanceInfo | null> {
  try {
    const providers = [getBTCBalanceFromMempool, getBTCBalanceFromBlockCypher];
    let balance = null;

    for (const provider of providers) {
      try {
        const result = await provider(address);
        if (result) {
          balance = result;
          console.log(`Using balance data from ${provider.name}`);
          break;
        }
      } catch (error) {
        console.error(`${provider.name} failed:`, error);
      }
    }

    if (!balance) return null;

    const confirmedBTC = Number(formatSatoshisToBTC(balance.confirmed, {
      includeSymbol: false,
      stripZeros: true,
    }));
    const unconfirmedBTC = Number(formatSatoshisToBTC(balance.unconfirmed, {
      includeSymbol: false,
      stripZeros: true,
    }));

    const info: BTCBalanceInfo = {
      address,
      balance: confirmedBTC,
      txCount: balance.txCount ?? 0,
      unconfirmedBalance: unconfirmedBTC,
      unconfirmedTxCount: balance.unconfirmedTxCount ?? 0,
    };

    if (options.includeUSD) {
      // NEW: Use centralized service approach
      let btcPrice = 0;

      if (typeof window !== "undefined") {
        // Client-side: use the centralized endpoint
        try {
          const response = await fetch("/api/internal/btcPrice");
          if (response.ok) {
            const data = await response.json();
            btcPrice = formatUSDValue(data.data?.price || 0);
          }
        } catch (error) {
          console.warn(
            "Failed to fetch BTC price for balance calculation:",
            error,
          );
        }
      } else {
        // Server-side: use the service directly
        try {
          const { BTCPriceService } = await import(
            "$server/services/price/btcPriceService.ts"
          );
          const btcPriceData = await BTCPriceService.getPrice();
          btcPrice = formatUSDValue(btcPriceData.price);
        } catch (error) {
          console.warn(
            "Failed to fetch BTC price from BTCPriceService for balance calculation:",
            error,
          );
        }
      }

      info.btcPrice = btcPrice;
      info.usdValue = formatUSDValue(confirmedBTC * btcPrice);
    }

    console.log("Address Info:", info);
    return info;
  } catch (error) {
    console.error("Error in getBTCBalanceInfo:", error);
    return null;
  }
}
