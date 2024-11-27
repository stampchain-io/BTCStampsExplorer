import { formatSatoshisToBTC, formatUSDValue } from "$lib/utils/formatUtils.ts";
import { AddressInfoOptions, BTCAddressInfo } from "$lib/types/index.d.ts";
import {
  BLOCKCYPHER_API_BASE_URL,
  MEMPOOL_API_BASE_URL,
} from "$lib/utils/constants.ts";

export async function fetchBTCPriceInUSD(apiBaseUrl?: string): Promise<number> {
  try {
    // For production, use full URL if apiBaseUrl is provided
    // For local development, use relative path
    const url = apiBaseUrl
      ? new URL("/api/internal/btcPrice", apiBaseUrl).toString()
      : "/api/internal/btcPrice";

    const response = await fetch(url);
    if (!response.ok) {
      console.warn(
        `BTC price endpoint returned ${response.status}: ${response.statusText}`,
      );
      return 0;
    }

    const data = await response.json();
    return formatUSDValue(data.data?.price || 0);
  } catch (error) {
    console.error("Error fetching BTC price:", error);
    return 0;
  }
}

interface AddressBalance {
  confirmed: number;
  unconfirmed: number;
  txCount?: number;
  unconfirmedTxCount?: number;
}

interface TxCounts {
  txCount: number;
  unconfirmedTxCount: number;
}

async function getAddressFromMempool(
  address: string,
): Promise<AddressBalance | null> {
  try {
    const response = await fetch(`${MEMPOOL_API_BASE_URL}/address/${address}`);
    if (!response.ok) return null;

    const data = await response.json();
    return {
      confirmed: data.chain_stats.funded_txo_sum -
        data.chain_stats.spent_txo_sum,
      unconfirmed: data.mempool_stats.funded_txo_sum -
        data.mempool_stats.spent_txo_sum,
    };
  } catch (error) {
    console.error("Mempool balance fetch error:", error);
    return null;
  }
}

async function getAddressFromBlockCypher(
  address: string,
): Promise<AddressBalance | null> {
  try {
    const response = await fetch(
      `${BLOCKCYPHER_API_BASE_URL}/v1/btc/main/addrs/${address}`,
    );
    if (!response.ok) return null;

    const data = await response.json();
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

export async function getAddressInfo(
  address: string,
  options: AddressInfoOptions = {},
): Promise<BTCAddressInfo | null> {
  try {
    const providers = [getAddressFromMempool, getAddressFromBlockCypher];
    let balance = null;
    let txData: TxCounts | null = null;

    for (const provider of providers) {
      try {
        const result = await provider(address);
        if (result) {
          balance = result;
          if ("txCount" in result) {
            txData = {
              txCount: result.txCount,
              unconfirmedTxCount: result.unconfirmedTxCount || 0,
            };
          }
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

    const info: BTCAddressInfo = {
      address,
      balance: confirmedBTC,
      txCount: txData?.txCount ?? 0,
      unconfirmedBalance: unconfirmedBTC,
      unconfirmedTxCount: txData?.unconfirmedTxCount ?? 0,
    };

    if (options.includeUSD) {
      const btcPrice = await fetchBTCPriceInUSD(options.apiBaseUrl);
      info.btcPrice = btcPrice;
      info.usdValue = formatUSDValue(confirmedBTC * btcPrice);
    }

    console.log("Address Info:", info);
    return info;
  } catch (error) {
    console.error("Error in getAddressInfo:", error);
    return null;
  }
}
