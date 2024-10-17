export const getBtcBalance = async (address: string): Promise<number> => {
  try {
    const response = await fetch(
      `https://mempool.space/api/address/${address}/utxo`,
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const utxosJson = await response.json();
    const balance = utxosJson.reduce(
      (acc: number, utxo: { value: number }) => acc + utxo.value,
      0,
    );
    return balance / 100000000;
  } catch (error) {
    console.error("Error fetching BTC balance:", error);
    return 0;
  }
};

async function getBtcAddressInfoFromMempool(address: string) {
  try {
    const response = await fetch(
      `https://mempool.space/api/address/${address}`,
    );
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const data = await response.json();
    const { chain_stats, mempool_stats } = data;

    return {
      address: address,
      balance: (chain_stats.funded_txo_sum - chain_stats.spent_txo_sum) /
        100000000,
      txCount: chain_stats.tx_count,
      unconfirmedBalance:
        (mempool_stats.funded_txo_sum - mempool_stats.spent_txo_sum) /
        100000000,
      unconfirmedTxCount: mempool_stats.tx_count,
    };
  } catch (error) {
    console.error(
      "Error fetching address info from mempool.space:",
      error,
    );
    throw error;
  }
}

export async function getBtcAddressInfo(address: string) {
  try {
    return await getBtcAddressInfoFromMempool(address);
  } catch (error) {
    console.error(
      "Error fetching from mempool.space, falling back to QuickNode:",
      error,
    );
    return null;
  }
}

export async function fetchBTCPriceInUSD(apiBaseUrl?: string): Promise<number> {
  try {
    const base = apiBaseUrl ? apiBaseUrl.replace(/\/+$/, "") : "";
    const params = encodeURIComponent(
      JSON.stringify(["bitcoin", "usd", true, true, true]),
    );
    const url =
      `${base}/quicknode/getPrice?name=cg_simplePrice&params=${params}`;

    console.log("Constructed URL:", url);

    const response = await fetch(url);

    if (!response.ok) {
      console.error("Error fetching BTC price:", response.statusText);
      return 0;
    }

    const data = await response.json();
    return data.price;
  } catch (error) {
    console.error("Error fetching BTC price:", error);
    return 0;
  }
}
