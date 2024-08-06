import { handleXcpApiRequestWithCache } from "utils/xcpUtils.ts";
import { StampService } from "$lib/services/stampService.ts";
import { dbManager } from "$lib/database/db.ts";

export const xcp_v2_nodes = [
  {
    name: "counterparty.io",
    url: "https://api.counterparty.io:4000/v2",
  },
];

interface DispenseEvent {
  event_index: number;
  event: "DISPENSE";
  params: {
    asset: string;
    block_index: number;
    btc_amount: number;
    destination: string;
    dispense_index: number;
    dispense_quantity: number;
    dispenser_tx_hash: string;
    source: string;
    tx_hash: string;
    tx_index: number;
  };
  tx_hash: string;
  block_index: number;
  timestamp: string | null;
}

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
      if (holder.quantity > 0) { // if an item is on dispenser it is possible there is not any holders besides the dispenser addy
        return true;
      }
    },
  );
};

export class DispenserManager {
  private static cacheTimeout: number = 1000 * 60 * 5; // 5 minutes
  private static handleXcpApiRequestWithCache = handleXcpApiRequestWithCache;

  static async getDispensersByCpid(
    cpid: string,
    filter: "open" | "closed" | "all" = "open",
  ) {
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

    const filteredDispensers = filter === "all"
      ? dispensers
      : dispensers.filter((dispenser) =>
        filter === "open"
          ? dispenser.give_remaining > 0
          : dispenser.give_remaining === 0
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
    const [dispensers, allCPIDs] = await Promise.all([
      this.handleXcpApiRequestWithCache<any[]>(
        "get_dispensers",
        {},
        this.cacheTimeout,
      ),
      StampService.getAllCPIDs(),
    ]);

    if (!dispensers || !Array.isArray(dispensers)) {
      console.log("No dispensers found");
      return { total: 0, dispensers: [] };
    }

    const cpidMap = new Map(allCPIDs.map((cpid) => [cpid.cpid, cpid.stamp]));

    const openDispensers = dispensers.filter((dispenser) =>
      dispenser.give_remaining > 0 && cpidMap.has(dispenser.asset)
    );

    const mappedDispensersPromises = openDispensers.map(async (dispenser) => {
      const dispenses = this.getDispensesByCpid(dispenser.asset);
      return {
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
        dispenses: await dispenses,
        stamp: cpidMap.get(dispenser.asset),
      };
    });

    const mappedDispensers = await Promise.all(mappedDispensersPromises);

    const total = mappedDispensers.length;
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

export class XcpManager {
  private static cacheTimeout: number = 1000 * 60 * 5; // 5 minutes

  private static async fetchWithCache<T>(
    endpoint: string,
    queryParams: URLSearchParams,
  ): Promise<T> {
    const cacheKey = `api:v2:${endpoint}:${queryParams.toString()}`;

    return await dbManager.handleCache(
      cacheKey,
      async () => {
        const url = `${
          xcp_v2_nodes[0].url
        }${endpoint}?${queryParams.toString()}`;
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return await response.json();
      },
      this.cacheTimeout,
    );
  }

  static getDispenseEvents(
    cursor: string | null = null,
    limit: number = 10000,
  ): Promise<{
    result: DispenseEvent[];
    next_cursor: string | null;
    result_count: number;
  }> {
    const endpoint = "/events/DISPENSE";
    const queryParams = new URLSearchParams();
    if (cursor) {
      queryParams.append("cursor", cursor);
    }
    queryParams.append("limit", limit.toString());

    return this.fetchWithCache<{
      result: DispenseEvent[];
      next_cursor: string | null;
      result_count: number;
    }>(endpoint, queryParams);
  }

  static async fetchDispenseEvents(
    limit: number | "all" = "all",
  ): Promise<DispenseEvent[]> {
    let cursor: string | null = null;
    const batchSize = 1000;
    let allEvents: DispenseEvent[] = [];

    do {
      const response = await this.getDispenseEvents(cursor, batchSize);

      if (
        !response || typeof response !== "object" ||
        !Array.isArray(response.result)
      ) {
        throw new Error("Unexpected response structure from getDispenseEvents");
      }

      const validEvents = response.result.filter(
        (event): event is DispenseEvent => {
          return (
            typeof event === "object" &&
            event !== null &&
            typeof event.event_index === "number" &&
            event.event === "DISPENSE" &&
            typeof event.params === "object" &&
            event.params !== null &&
            typeof event.params.asset === "string" &&
            typeof event.params.block_index === "number" &&
            typeof event.params.btc_amount === "number" &&
            typeof event.params.destination === "string" &&
            typeof event.params.dispense_index === "number" &&
            typeof event.params.dispense_quantity === "number" &&
            typeof event.params.dispenser_tx_hash === "string" &&
            typeof event.params.source === "string" &&
            typeof event.params.tx_hash === "string" &&
            typeof event.params.tx_index === "number" &&
            typeof event.tx_hash === "string" &&
            typeof event.block_index === "number"
          );
        },
      );

      allEvents = allEvents.concat(validEvents);
      cursor = response.next_cursor;

      // If we've reached the desired limit, break the loop
      if (limit !== "all" && allEvents.length >= limit) {
        allEvents = allEvents.slice(0, limit);
        break;
      }
    } while (cursor);

    return allEvents;
  }
}
