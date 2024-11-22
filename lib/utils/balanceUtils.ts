import { getUTXOForAddress } from "./utxoUtils.ts";
import { formatSatoshisToBTC, formatUSDValue } from "./formatUtils.ts";
import { UTXO } from "$lib/types/utils.d.ts";

interface BalanceOptions {
  format?: "BTC" | "satoshis";
  fallbackValue?: number | null;
}

interface AddressInfoOptions {
  includeUSD?: boolean;
  apiBaseUrl?: string;
}

interface BTCAddressInfo {
  address: string;
  balance: number;
  txCount: number;
  unconfirmedBalance: number;
  unconfirmedTxCount: number;
  usdValue?: number;
  btcPrice?: number;
}

export async function fetchBTCPriceInUSD(apiBaseUrl?: string): Promise<number> {
  const base = apiBaseUrl || "";
  const params = encodeURIComponent(
    JSON.stringify(["bitcoin", "usd", true, true, true]),
  );
  const url = `${base}/quicknode/getPrice?name=cg_simplePrice&params=${params}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      console.error("Error fetching BTC price:", response.statusText);
      return 0;
    }

    const data = await response.json();
    return formatUSDValue(data.price || 0);
  } catch (error) {
    console.error("Error fetching BTC price:", error);
    return 0;
  }
}

export async function getAddressBalance(
  address: string,
  options: BalanceOptions = {},
): Promise<number | null> {
  const {
    format = "satoshis",
    fallbackValue = null,
  } = options;

  try {
    const utxos = await getUTXOForAddress(address);
    if (!utxos) return fallbackValue;

    const balanceInSats = utxos.reduce((sum, utxo) => sum + utxo.value, 0);

    if (format === "BTC") {
      return Number(formatSatoshisToBTC(balanceInSats, {
        includeSymbol: false,
        stripZeros: true,
      }));
    }

    return balanceInSats;
  } catch (error) {
    console.error("Error fetching balance:", error);
    return fallbackValue;
  }
}

export async function getAddressInfo(
  address: string,
  options: AddressInfoOptions = {},
): Promise<BTCAddressInfo | null> {
  try {
    const utxos = await getUTXOForAddress(address);
    if (!utxos || utxos.length === 0) return null;

    const balance = await getAddressBalance(address, {
      format: "BTC",
      fallbackValue: 0,
    });

    // Count confirmed and unconfirmed transactions
    const confirmedUtxos = utxos.filter((utxo) => utxo.status.confirmed);
    const unconfirmedUtxos = utxos.filter((utxo) => !utxo.status.confirmed);

    // Calculate unconfirmed balance
    const unconfirmedBalance = unconfirmedUtxos.reduce(
      (sum, utxo) => sum + utxo.value,
      0,
    );

    const info: BTCAddressInfo = {
      address,
      balance: balance ?? 0,
      txCount: confirmedUtxos.length,
      unconfirmedBalance: Number(formatSatoshisToBTC(unconfirmedBalance, {
        includeSymbol: false,
        stripZeros: true,
      })),
      unconfirmedTxCount: unconfirmedUtxos.length,
    };

    // Optionally fetch and include USD value
    if (options.includeUSD) {
      const btcPrice = await fetchBTCPriceInUSD(options.apiBaseUrl);
      info.btcPrice = btcPrice;
      info.usdValue = formatUSDValue((info.balance ?? 0) * btcPrice);
    }

    return info;
  } catch (error) {
    console.error("Error fetching address info:", error);
    return null;
  }
}
