// import { handleApiRequestWithCache } from "utils/cache.ts";
import { handleApiRequestWithCache } from "utils/apiCache.ts";

// import { XCPParams } from "globals";

export const xcp_public_nodes = [
  {
    name: "stampchain.io",
    url:
      "https://k6e0ufzq8h.execute-api.us-east-1.amazonaws.com/beta/counterpartyproxy",
    user: "rpc",
    password: "rpc",
  },
  {
    name: "xcp.dev",
    url: "https://api.xcp.dev/0/v9_61",
    user: "rpc",
    password: "rpc",
  },
  {
    name: "counterparty.io",
    url: "http://api.counterparty.io:4000/",
    user: "rpc",
    password: "rpc",
  },
  {
    name: "coindaddy",
    url: "https://public.coindaddy.io:4001/api/rest",
    user: "rpc",
    password: "1234",
  },
];

// curl -X GET 'https://api.counterparty.io:4000/v2/healthz'
// {"result": {"status": "Healthy"}}%

/**
 * Retrieves the balances for a given address.
 * @param address - The address for which to retrieve the balances.
 * @returns An array of balances, each containing the asset ID, quantity, and divisibility.
 */
export const get_balances = async (address: string) => {
  const params = {
    filters: [
      {
        field: "address",
        op: "==",
        value: address,
      },
    ],
  };
  // const payload = CreatePayload("get_balances", params); // now done in handleApiRequestWithCache
  const balances = await handleApiRequestWithCache(
    "get_balances",
    params,
    1000 * 60 * 5,
  );

  if (!balances) {
    return [];
  }
  return balances
    .filter((balance: any) => balance.quantity > 0)
    .map((balance: any) => ({
      cpid: balance.asset,
      quantity: balance.quantity,
      divisible: balance.divisible,
    }));
};

/**
 * Retrieves the stamps balance for a given address.
 * @param address - The address for which to retrieve the stamps balance.
 * @returns A promise that resolves to the stamps balance.
 */
export const get_stamps_balance = async (address: string) => {
  //TODO: filter xcp balances and add populated info with stamptable data
  return await get_balances(address);
};

/**
 * Retrieves a list of sends for a given cpid.
 * @param cpid - The cpid to filter sends by.
 * @returns An array of sends, each containing transaction hash, block index, source, destination, quantity, and asset.
 */
export const get_sends = async (cpid: string) => {
  const params = {
    filters: [
      {
        field: "asset",
        op: "==",
        value: cpid,
      },
      {
        field: "status",
        op: "==",
        value: "valid",
      },
    ],
    "filterop": "AND",
  };
  const sends = await handleApiRequestWithCache(
    "get_sends",
    params,
    1000 * 60 * 5,
  );
  if (!sends) {
    console.log("no sends found");
    return [];
  }
  return sends.map((send: any) => ({
    tx_hash: send.tx_hash,
    block_index: send.block_index,
    source: send.source,
    destination: send.destination,
    quantity: send.quantity,
    asset: send.asset,
  }));
};

/**
 * Retrieves the holders of a specific asset.
 *
 * @param cpid - The asset identifier.
 * @returns An array of holders with a positive quantity of the specified asset.
 */
export const get_holders = async (cpid: string) => {
  const params = {
    filters: [
      {
        field: "asset",
        op: "==",
        value: cpid,
      },
    ],
  };
  const holders = await handleApiRequestWithCache(
    "get_balances",
    params,
    1000 * 60 * 5,
  );
  if (!holders) {
    return [];
  }
  return holders.filter(
    (holder: any) => {
      if (holder.quantity > 0) {
        return true;
      }
    },
  );
};

/**
 * Retrieves the open dispensers for a given asset.
 * @param cpid - The asset identifier.
 * @returns An array of mapped dispensers.
 */
export const get_dispensers = async (cpid: string) => {
  const params = {
    filters: [
      {
        field: "asset",
        op: "==",
        value: cpid,
      },
    ],
  };
  const dispensers = await handleApiRequestWithCache(
    "get_dispensers",
    params,
    1000 * 60 * 5,
  );

  if (!dispensers) {
    return [];
  }

  const filteredDispensers = dispensers.filter((dispenser: string) =>
    dispenser.give_remaining > 0
  );

  const mappedDispensers = filteredDispensers.map((dispenser: any) => ({
    tx_hash: dispenser.tx_hash,
    block_index: dispenser.block_index,
    source: dispenser.source,
    cpid: dispenser.asset,
    give_quantity: dispenser.give_quantity,
    give_remaining: dispenser.give_remaining,
    escrow_quantity: dispenser.escrow_quantity,
    satoshirate: dispenser.satoshirate,
    btcrate: dispenser.satoshirate / 100000000,
    origin: dispenser.origin,
  }));

  return mappedDispensers;
};

/**
 * Retrieves all dispensers with remaining give quantity.
 * @returns An object containing the total number of dispensers and an array of mapped dispensers.
 */
export const get_all_dispensers = async (
  page: number = 1,
  limit: number = 10,
) => {
  const dispensers = await handleApiRequestWithCache(
    "get_dispensers",
    {},
    1000 * 60 * 5,
  );

  if (!dispensers) {
    console.log("No dispensers found");
    return { total: 0, dispensers: [] };
  }

  const openDispensers = dispensers.filter((dispenser: any) =>
    dispenser.give_remaining > 0
  );

  const mappedDispensers = await Promise.all(
    openDispensers.map(async (dispenser: any) => {
      const dispenses = await get_dispenses(dispenser.asset);
      return {
        tx_hash: dispenser.tx_hash,
        block_index: dispenser.block_index,
        source: dispenser.source,
        cpid: dispenser.asset,
        give_quantity: dispenser.give_quantity,
        give_remaining: dispenser.give_remaining,
        escrow_quantity: dispenser.escrow_quantity,
        satoshirate: dispenser.satoshirate,
        btcrate: dispenser.satoshirate / 100000000, // Convert satoshis to BTC
        origin: dispenser.origin,
        dispenses,
      };
    }),
  );

  const total = openDispensers.length;

  // Calculate pagination
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedDispensers = mappedDispensers.slice(startIndex, endIndex);

  return { total, dispensers: paginatedDispensers };
};

/**
 * Retrieves dispenses for a given cpid.
 * @param cpid - The asset identifier.
 * @returns An array of dispenses.
 */
export const get_dispenses = async (cpid: string) => {
  const params = {
    filters: [
      {
        field: "asset",
        op: "==",
        value: cpid,
      },
    ],
  };
  const dispenses = await handleApiRequestWithCache(
    "get_dispenses",
    params,
    1000 * 60 * 3,
  );

  if (!dispenses) {
    return [];
  }

  return dispenses.map((dispense: any) => ({
    tx_hash: dispense.tx_hash,
    block_index: dispense.block_index,
    cpid: dispense.asset,
    source: dispense.source,
    destination: dispense.destination,
    dispenser_tx_hash: dispense.dispenser_tx_hash,
    dispense_quantity: dispense.dispense_quantity,
  }));
};
