// TODO: this is for leather and phantom, perhaps balance can be pulled properly from the wallet
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
