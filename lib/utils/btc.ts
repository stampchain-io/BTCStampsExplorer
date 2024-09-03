export const getBtcBalance = async (address: string) => {
  const utxos = await fetch(
    `https://mempool.space/api/address/${address}/utxo`,
  );
  const utxosJson = await utxos.json();
  const balance = utxosJson.reduce((acc, utxo) => acc + utxo.value, 0);
  return balance / 100000000;
};

async function getBtcAddressInfoFromMempool(address: string) {
  const response = await fetch(`https://mempool.space/api/address/${address}`);
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
      (mempool_stats.funded_txo_sum - mempool_stats.spent_txo_sum) / 100000000,
    unconfirmedTxCount: mempool_stats.tx_count,
  };
}

async function getBtcAddressInfoFromQuickNode(address: string) {
  const fetchQuickNode = async (name: string, params: any[]) => {
    const response = await fetch("/quicknode/getPrice", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, params }),
    });
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return await response.json();
  };

  const balance = await fetchQuickNode("getbalance", [address]);
  const unconfirmedBalance = await fetchQuickNode("getunconfirmedbalance", [
    address,
  ]);
  const txCount = await fetchQuickNode("getreceivedbyaddress", [address, 0]);
  const unconfirmedTxCount = await fetchQuickNode("getunconfirmedbalance", [
    address,
  ]);

  return {
    address: address,
    balance: balance.result,
    txCount: txCount.result,
    unconfirmedBalance: unconfirmedBalance.result,
    unconfirmedTxCount: unconfirmedTxCount.result,
  };
}

export async function getBtcAddressInfo(address: string) {
  try {
    return await getBtcAddressInfoFromMempool(address);
  } catch (error) {
    console.error(
      "Error fetching from mempool.space, falling back to QuickNode:",
      error,
    );
    try {
      return await getBtcAddressInfoFromQuickNode(address);
    } catch (quickNodeError) {
      console.error("Error fetching from QuickNode:", quickNodeError);
      throw new Error("Failed to fetch BTC address info from both sources");
    }
  }
}
