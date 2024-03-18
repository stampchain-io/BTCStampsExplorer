import { CommonClass, getClient, Src20Class } from "$lib/database/index.ts";
import { getBtcAddressInfo } from "../utils/btc.ts";
import { SMALL_LIMIT } from "utils/constants.ts";
import { paginate } from "../utils/util.ts";

export const api_get_stamp_balance = async (
  address: string,
  limit = SMALL_LIMIT,
  page = 1,
) => {
  try {
    const client = await getClient();
    const balances = await CommonClass
      .get_stamp_balances_by_address_with_client(
        client,
        address,
        limit,
        page,
      );
    return balances;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

export const api_get_src20_valid_tx = async (tx_hash: string) => {
  try {
    const client = await getClient();
    const tx_data = await Src20Class.get_valid_src20_tx_by_tx_hash_with_client(
      client,
      tx_hash,
    );
    return tx_data.rows[0];
  } catch (error) {
    console.error(error);
    throw error;
  }
};

/**
 * Retrieves the SRC20 token balances for a given address.
 *
 * @param address - The address for which to retrieve the SRC20 token balances.
 * @returns A Promise that resolves to an array of SRC20 token balances.
 * @throws If there is an error while retrieving the SRC20 token balances.
 */
export const api_get_src20_balance = async (address: string) => {
  try {
    const client = await getClient();
    const balances = await Src20Class.get_src20_balance_by_address_with_client(
      client,
      address,
    );
    if (balances.rows.length === 0) {
      return [];
    }
    return balances.rows;
  } catch (error) {
    console.error(error);
    throw error;
  }
};

/**
 * Retrieves the balance of a specific SRC20 token for a given address and tick.
 *
 * @param address - The address for which to retrieve the balance.
 * @param tick - The tick of the SRC20 token.
 * @returns The balance of the SRC20 token for the given address and tick.
 * @throws If an error occurs while retrieving the balance.
 */
export const api_get_src20_balance_by_tick = async (
  address: string,
  tick: string,
) => {
  try {
    const client = await getClient();
    const balances = await Src20Class
      .get_src20_balance_by_address_and_tick_with_client(
        client,
        address,
        tick,
      );
    return balances.rows[0];
  } catch (error) {
    console.error(error);
    throw error;
  }
};

/**
 * Retrieves the balance information for a given address.
 * @param address - The address for which to retrieve the balance.
 * @param limit - The maximum number of results to return per page. Default is 50.
 * @param page - The page number to retrieve. Default is 1.
 * @returns An object containing the balance information.
 */
export const api_get_balance = async (
  address: string,
  limit = 50,
  page = 1,
) => {
  try {
    const client = await getClient();
    const total =
      (await CommonClass.get_total_stamp_balance_with_client(client, address))
        .rows[0]["total"] || 0;
    const pagination = paginate(total, page, limit);

    const btcInfo = await getBtcAddressInfo(address);
    let stamps;
    if (total !== 0) {
      stamps = await CommonClass
        .get_stamp_balances_by_address_with_client(
          client,
          address,
          limit,
          page,
        );
    } else {
      stamps = [];
    }
    const src20 = await Src20Class.get_src20_balance_by_address_with_client(
      client,
      address,
    );
    return {
      ...pagination,
      btc: btcInfo,
      data: {
        stamps: stamps,
        src20: src20.rows,
      },
    };
  } catch (error) {
    console.error(error);
    throw error;
  }
};
