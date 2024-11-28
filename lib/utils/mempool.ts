const MAX_RETRIES = 3;
import { MEMPOOL_API_BASE_URL } from "$lib/utils/constants.ts";
import { BTCBalance, MempoolAddressResponse } from "$lib/types/index.d.ts";

interface RecommendedFees {
  fastestFee: number;
  halfHourFee: number;
  hourFee: number;
  economyFee: number;
  minimumFee: number;
}

export const getRecommendedFees = async (
  retries = 0,
): Promise<RecommendedFees | null> => {
  try {
    const endpoint = `${MEMPOOL_API_BASE_URL}/v1/fees/recommended`;
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(
        `Error: response for: ${endpoint} unsuccessful. Response: ${response.status}`,
      );
    }
    const data = await response.json();
    return data;
  } catch (error) {
    if (retries < MAX_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return await getRecommendedFees(retries + 1);
    } else {
      console.error(error);
      return null;
    }
  }
};

export const getCurrentBlock = async (retries = 0): Promise<number | null> => {
  try {
    const endpoint = `${MEMPOOL_API_BASE_URL}/v1/blocks/tip/height`;
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(
        `Error: response for: ${endpoint} unsuccessful. Response: ${response.status}`,
      );
    }
    const data = await response.json();
    return data;
  } catch (error) {
    if (retries < MAX_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return await getCurrentBlock(retries + 1);
    } else {
      console.error(error);
      return null;
    }
  }
};

export const getTransactionInfo = async (
  txid: string,
  retries = 0,
): Promise<string | null> => {
  try {
    const endpoint = `${MEMPOOL_API_BASE_URL}/tx/${txid}/hex`;
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(
        `Error: response for: ${endpoint} unsuccessful. Response: ${response.status}`,
      );
    }
    const data = await response.json();
    return data;
  } catch (error) {
    if (retries < MAX_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return await getTransactionInfo(txid, retries + 1);
    } else {
      console.error(error);
      return null;
    }
  }
};

export const getBTCBalanceFromMempool = async (
  address: string,
  retries = 0,
): Promise<BTCBalance | null> => {
  try {
    const endpoint = `${MEMPOOL_API_BASE_URL}/address/${address}`;
    const response = await fetch(endpoint);
    if (!response.ok) {
      throw new Error(
        `Error: response for: ${endpoint} unsuccessful. Response: ${response.status}`,
      );
    }

    const data = await response.json() as MempoolAddressResponse;
    return {
      confirmed: data.chain_stats.funded_txo_sum -
        data.chain_stats.spent_txo_sum,
      unconfirmed: data.mempool_stats.funded_txo_sum -
        data.mempool_stats.spent_txo_sum,
      txCount: data.chain_stats.tx_count,
      unconfirmedTxCount: data.mempool_stats.tx_count,
    };
  } catch (error) {
    if (retries < MAX_RETRIES) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      return await getBTCBalanceFromMempool(address, retries + 1);
    } else {
      console.error("Mempool balance fetch error:", error);
      return null;
    }
  }
};
