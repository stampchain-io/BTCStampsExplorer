import { formatSatoshisToBTC } from "$lib/utils/formatUtils.ts";

export const getBtcBalance = async (address: string): Promise<number> => {
  try {
    const response = await fetch(
      `https://mempool.space/api/address/${address}/utxo`,
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const utxosJson = await response.json();
    const satoshis = utxosJson.reduce(
      (acc: number, utxo: { value: number }) => acc + utxo.value,
      0,
    );
    return Number(formatSatoshisToBTC(satoshis, { includeSymbol: false }));
  } catch (error) {
    console.error("Error fetching BTC balance:", error);
    return 0;
  }
};
