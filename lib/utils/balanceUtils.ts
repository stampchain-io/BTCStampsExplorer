import { formatSatoshisToBTC, formatUSDValue } from "$lib/utils/formatUtils.ts";
import {
  BlockCypherAddressBalanceResponse,
  BTCBalance,
  BTCBalanceInfo,
  BTCBalanceInfoOptions,
} from "$lib/types/index.d.ts";
import { BLOCKCYPHER_API_BASE_URL } from "$lib/utils/constants.ts";
import { getBTCBalanceFromMempool } from "$lib/utils/mempool.ts";

// Cache for BTC price with TTL
let btcPriceCache: {
  price: number;
  timestamp: number;
} | null = null;

const CACHE_TTL = 10 * 60 * 1000; // 5 minutes in milliseconds

export async function fetchBTCPriceInUSD(apiBaseUrl?: string): Promise<number> {
  const requestId = `btc-price-${Date.now()}-${
    Math.random().toString(36).substr(2, 9)
  }`;

  // Check cache first
  if (btcPriceCache && Date.now() - btcPriceCache.timestamp < CACHE_TTL) {
    console.log(
      `[${requestId}] Using cached BTC price: ${btcPriceCache.price}`,
    );
    return btcPriceCache.price;
  }

  console.log(
    `[${requestId}] Cache miss, fetching BTC price, apiBaseUrl: ${
      apiBaseUrl || "none"
    }`,
  );

  try {
    const path = "/api/internal/btcPrice";
    let finalUrl: string;

    if (apiBaseUrl) {
      finalUrl = new URL(path, apiBaseUrl).toString();
    } else {
      const env = Deno.env.get("DENO_ENV");
      let baseUrlFromEnv: string | undefined;

      if (env === "development") {
        baseUrlFromEnv = Deno.env.get("DEV_BASE_URL");
      } else { // 'production' or other fallback
        baseUrlFromEnv = Deno.env.get("BASE_URL");
      }

      if (baseUrlFromEnv) {
        finalUrl = new URL(path, baseUrlFromEnv).toString();
      } else {
        // Fallback for local development if DEV_BASE_URL is not set.
        if (env === "development") {
          finalUrl = new URL(path, "http://localhost:8000").toString(); // Assuming default Fresh port
          console.warn(
            `[${requestId}] DEV_BASE_URL not set for server-side fetch, defaulting to http://localhost:8000 for path: ${path}. Please ensure DEV_BASE_URL is configured in your environment for robustness.`,
          );
        } else {
          console.error(
            `[${requestId}] Critical: API base URL (BASE_URL or DEV_BASE_URL) is not defined. Cannot fetch BTC price for path: ${path}. Ensure BASE_URL is set for production.`,
          );
          return btcPriceCache?.price || 0; // Return cached or 0
        }
      }
    }

    console.log(`[${requestId}] Constructed URL for fetch: ${finalUrl}`);
    const response = await fetch(finalUrl);
    console.log(
      `[${requestId}] Response status: ${response.status} ${response.statusText}`,
    );

    if (!response.ok) {
      console.warn(
        `[${requestId}] BTC price endpoint returned ${response.status}: ${response.statusText}`,
      );
      return btcPriceCache?.price || 0; // Return cached price if available, otherwise 0
    }

    const text = await response.text();
    console.log(`[${requestId}] Raw response:`, text);

    const data = JSON.parse(text);
    console.log(`[${requestId}] Parsed data:`, data);

    const price = formatUSDValue(data.data?.price || 0);
    console.log(`[${requestId}] Formatted price: ${price}`);

    // Update cache
    btcPriceCache = {
      price,
      timestamp: Date.now(),
    };

    return price;
  } catch (error) {
    console.error(`[${requestId}] Error fetching BTC price:`, error);
    return btcPriceCache?.price || 0; // Return cached price if available, otherwise 0
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
    return {
      confirmed: data.balance || 0,
      unconfirmed: data.unconfirmed_balance || 0,
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
      const btcPrice = await fetchBTCPriceInUSD(options.apiBaseUrl);
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
