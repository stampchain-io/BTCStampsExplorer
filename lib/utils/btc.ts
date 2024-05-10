export const getBtcBalance = async (address: string) => {
  const utxos = await fetch(
    `https://mempool.space/api/address/${address}/utxo`,
  );
  const utxosJson = await utxos.json();
  const balance = utxosJson.reduce((acc, utxo) => acc + utxo.value, 0);
  return balance / 100000000;
};

export const getBtcAddressInfo = async (address: string) => {
  const utxos = await fetch(
    `https://mempool.space/api/address/${address}`,
  );
  const utxosText = await utxos.text(); // Get the response as text
  console.log(utxosText); // Log the response text

  try {
    const {
      chain_stats,
      mempool_stats,
    } = JSON.parse(utxosText); // Parse the text as JSON

    const {
      funded_txo_sum,
      spent_txo_sum,
      tx_count,
    } = chain_stats;
    const {
      funded_txo_sum: mempool_funded_txo_sum,
      spent_txo_sum: mempool_spent_txo_sum,
      tx_count: mempool_tx_count,
    } = mempool_stats;
    const balance = funded_txo_sum - spent_txo_sum;
    const unconfirmedBalance = mempool_funded_txo_sum - mempool_spent_txo_sum;
    const data = {
      address: address,
      balance: balance / 100000000,
      txCount: tx_count,
      unconfirmedBalance: unconfirmedBalance / 100000000,
      unconfirmedTxCount: mempool_tx_count,
    };
    return data;
  } catch (error) {
    console.error("Error parsing JSON:", error);
  }
};
