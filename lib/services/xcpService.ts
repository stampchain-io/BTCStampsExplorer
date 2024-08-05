import { handleXcpApiRequestWithCache } from "utils/xcpUtils.ts";

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
  // const payload = CreatePayload("get_balances", params); // now done in handleXcpApiRequestWithCache
  const balances = await handleXcpApiRequestWithCache(
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
  const sends = await handleXcpApiRequestWithCache(
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
  const holders = await handleXcpApiRequestWithCache(
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

export class DispenserManager {
  private static cacheTimeout: number = 1000 * 60 * 5; // 5 minutes
  private static handleXcpApiRequestWithCache = handleXcpApiRequestWithCache;

  static async getDispensersByCpid(cpid: string) {
    const params = {
      filters: [
        {
          field: "asset",
          op: "==",
          value: cpid,
        },
      ],
    };
    const dispensers = await DispenserManager.handleXcpApiRequestWithCache<
      any[]
    >(
      "get_dispensers",
      params,
      1000 * 60 * 5,
    );

    if (!dispensers || !Array.isArray(dispensers)) {
      return [];
    }

    const filteredDispensers = dispensers.filter((dispenser) =>
      dispenser.give_remaining > 0
    );

    return filteredDispensers.map((dispenser: any) => ({
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
  }

  static async getAllDispensers(page: number = 1, limit: number = 10) {
    const dispensers = await DispenserManager.handleXcpApiRequestWithCache<
      any[]
    >(
      "get_dispensers",
      {},
      this.cacheTimeout,
    );

    if (!dispensers || !Array.isArray(dispensers)) {
      console.log("No dispensers found");
      return { total: 0, dispensers: [] };
    }

    const openDispensers = dispensers.filter((dispenser) =>
      dispenser.give_remaining > 0
    );

    const mappedDispensers = await Promise.all(
      openDispensers.map(async (dispenser) => {
        const dispenses = await this.getDispensesByCpid(dispenser.asset);
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
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedDispensers = mappedDispensers.slice(startIndex, endIndex);

    return { total, dispensers: paginatedDispensers };
  }

  static async getDispensesByCpid(cpid: string) {
    const params = {
      filters: [
        {
          field: "asset",
          op: "==",
          value: cpid,
        },
      ],
    };
    const dispenses = await this.handleXcpApiRequestWithCache(
      "get_dispenses",
      params,
      this.cacheTimeout,
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
  }
}
