import {
  BlockCypherAddressBalanceResponse,
  BTCBalance,
  BTCBalanceInfo,
  BTCBalanceInfoOptions,
} from "$lib/types/index.d.ts";
import { BLOCKCYPHER_API_BASE_URL } from "$constants";
import { formatSatoshisToBTC, formatUSDValue } from "$lib/utils/formatUtils.ts";
import { getBTCBalanceFromMempool } from "$lib/utils/mempool.ts";
import { dbManager } from "$server/database/databaseManager.ts";

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

// Cached wrapper for getBTCBalanceFromMempool with Redis caching
async function getCachedBTCBalanceFromMempool(
  address: string,
): Promise<BTCBalance | null> {
  const cacheKey = `btc_balance:mempool:${address}`;
  const cacheDuration = 60; // 60 seconds TTL - balances can change frequently

  try {
    return await dbManager.handleCache(
      cacheKey,
      () => getBTCBalanceFromMempool(address),
      cacheDuration,
    ) as BTCBalance | null;
  } catch (error) {
    console.error("Cached balance fetch error:", error);
    // Fallback to direct call if caching fails
    return getBTCBalanceFromMempool(address);
  }
}

// Cached wrapper for getBTCBalanceFromBlockCypher with Redis caching
async function getCachedBTCBalanceFromBlockCypher(
  address: string,
): Promise<BTCBalance | null> {
  const cacheKey = `btc_balance:blockcypher:${address}`;
  const cacheDuration = 60; // 60 seconds TTL

  try {
    return await dbManager.handleCache(
      cacheKey,
      () => getBTCBalanceFromBlockCypher(address),
      cacheDuration,
    ) as BTCBalance | null;
  } catch (error) {
    console.error("Cached BlockCypher balance fetch error:", error);
    // Fallback to direct call if caching fails
    return getBTCBalanceFromBlockCypher(address);
  }
}

export async function getBTCBalanceInfo(
  address: string,
  options: BTCBalanceInfoOptions = {},
): Promise<BTCBalanceInfo | null> {
  try {
    // Use cached versions of balance providers
    const providers = [
      {
        name: "Mempool (cached)",
        fn: () => getCachedBTCBalanceFromMempool(address),
      },
      {
        name: "BlockCypher (cached)",
        fn: () => getCachedBTCBalanceFromBlockCypher(address),
      },
    ];
    let balance = null;

    for (const provider of providers) {
      try {
        const result = await provider.fn();
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
