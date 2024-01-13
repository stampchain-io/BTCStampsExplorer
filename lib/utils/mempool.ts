//import { handleCache } from 'utils/cache.ts';

const base_endpoint = "https://mempool.space/";
const MAX_RETRIES = 3;

export const getRecommendedFees = async (retries = 0) => {
  try {
    const endpoint = `${base_endpoint}api/v1/fees/recommended`;
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

export const getCurrentBlock = async (retries = 0) => {
  try {
    const endpoint = `${base_endpoint}api/v1/blocks/tip/height`;
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

/*
 TODO: look a way to dont relay on mempool space api for this, Quicknode is 75$/m for this addon
*/
export const getUTXOForAddress = async (address: string, retries = 0) => {
  try {
    const endpoint = `${base_endpoint}api/address/${address}/utxo`;
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
      return await getUTXOForAddress(address, retries + 1);
    } else {
      console.error(error);
      return null;
    }
  }
};

export const getTransactionInfo = async (txid: string, retries = 0) => {
  try {
    const endpoint = `${base_endpoint}api/tx/${txid}/hex`;
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
