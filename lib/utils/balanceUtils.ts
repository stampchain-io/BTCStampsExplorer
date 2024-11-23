import { getUTXOForAddress } from "$lib/utils/utxoUtils.ts";
import { formatSatoshisToBTC, formatUSDValue } from "$lib/utils/formatUtils.ts";
import {
  AddressInfoOptions,
  BalanceOptions,
  BTCAddressInfo,
  UTXO,
} from "$lib/types/index.d.ts";

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
    const utxoResponse = await getUTXOForAddress(address);
    if (!utxoResponse) return fallbackValue;

    // Handle both UTXO[] and TxInfo types
    const utxos = Array.isArray(utxoResponse)
      ? utxoResponse
      : utxoResponse.utxo
      ? [utxoResponse.utxo]
      : [];

    const balanceInSats = utxos.reduce(
      (sum: number, utxo: UTXO) => sum + utxo.value,
      0,
    );

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
    const utxoResponse = await getUTXOForAddress(address);
    if (!utxoResponse) return null;

    // Handle both UTXO[] and TxInfo types
    const utxos = Array.isArray(utxoResponse)
      ? utxoResponse
      : utxoResponse.utxo
      ? [utxoResponse.utxo]
      : [];

    if (utxos.length === 0) return null;

    const balance = await getAddressBalance(address, {
      format: "BTC",
      fallbackValue: 0,
    });

    // Count confirmed and unconfirmed transactions
    const confirmedUtxos = utxos.filter((utxo: UTXO) => utxo.status.confirmed);
    const unconfirmedUtxos = utxos.filter((utxo: UTXO) =>
      !utxo.status.confirmed
    );

    // Calculate unconfirmed balance
    const unconfirmedBalance = unconfirmedUtxos.reduce(
      (sum: number, utxo: UTXO) => sum + utxo.value,
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
