import { StampService } from "$lib/services/stampService.ts";
import { dbManager } from "../../server/database/db.ts";
import { DispenserFilter } from "$lib/types/index.d.ts";

export const xcp_v2_nodes = [
  {
    name: "stampchain.io",
    url:
      "https://k6e0ufzq8h.execute-api.us-east-1.amazonaws.com/beta/counterpartyproxy/v2",
  },
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

// NOTE: only the stampchain api appears to allow trx construction / issuance others get denied.
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

export async function fetchXcpV2WithCache<T>(
  endpoint: string,
  queryParams: URLSearchParams,
): Promise<T> {
  const cacheKey = `api:v2:${endpoint}:${queryParams.toString()}`;
  const cacheTimeout = 1000 * 60 * 5; // 5 minutes

  console.log(
    `Fetching XCP V2 with cache. Endpoint: ${endpoint}, QueryParams: ${queryParams.toString()}`,
  );

  return await dbManager.handleCache(
    cacheKey,
    async () => {
      for (const node of xcp_v2_nodes) {
        const url = `${node.url}${endpoint}?${queryParams.toString()}`;
        console.log(`Attempting to fetch from URL: ${url}`);

        try {
          const response = await fetch(url);
          console.log(`Response status from ${node.name}: ${response.status}`);

          if (!response.ok) {
            const errorBody = await response.text();
            console.error(
              `Error response body from ${node.name}: ${errorBody}`,
            );
            continue; // Try the next node
          }

          const data = await response.json();
          console.log(`Successful response from ${node.name}`);
          return data;
        } catch (error) {
          console.error(`Fetch error for ${url}:`, error);
          // Continue to the next node
        }
      }

      // If all nodes fail, return a minimal data structure
      console.error("All nodes failed. Returning minimal data structure.");
      return {
        result: [],
        next_cursor: null,
        result_count: 0,
      } as T;
    },
    cacheTimeout,
  );
}
// curl -X GET 'https://api.counterparty.io:4000/v2/healthz'
// {"result": {"status": "Healthy"}}%

export class DispenserManager {
  private static fetchXcpV2WithCache = fetchXcpV2WithCache;

  static async getDispensersByCpid(
    cpid: string,
    filter: DispenserFilter = "open",
  ): Promise<any[]> {
    const endpoint = `/assets/${cpid}/dispensers`;
    let allDispensers: any[] = [];
    let cursor: string | null = null;
    const limit = 1000;

    console.log(`Fetching dispensers for CPID: ${cpid}, Filter: ${filter}`);

    while (true) {
      const queryParams = new URLSearchParams({
        limit: limit.toString(),
      });
      if (cursor) {
        queryParams.append("cursor", cursor);
      }

      try {
        const response = await this.fetchXcpV2WithCache<any>(
          endpoint,
          queryParams,
        );

        if (!response || !Array.isArray(response.result)) {
          console.log(`No more results for CPID: ${cpid}`);
          break;
        }

        const dispensers = response.result.map((dispenser: any) => ({
          tx_hash: dispenser.tx_hash,
          block_index: dispenser.block_index,
          source: dispenser.source,
          cpid: cpid,
          give_quantity: dispenser.give_quantity,
          give_remaining: dispenser.give_remaining,
          escrow_quantity: dispenser.escrow_quantity,
          satoshirate: dispenser.satoshirate,
          btcrate: dispenser.satoshirate / 100000000,
          origin: dispenser.origin,
          confirmed: dispenser.confirmed,
          close_block_index: dispenser.close_block_index,
        }));

        allDispensers = allDispensers.concat(dispensers);

        if (response.next_cursor && response.next_cursor !== cursor) {
          cursor = response.next_cursor;
          console.log(`New cursor for CPID ${cpid}: ${cursor}`);
        } else {
          console.log(`No more pages for CPID ${cpid}`);
          break;
        }
      } catch (error) {
        console.error(`Error fetching dispensers for cpid ${cpid}:`, error);
        break;
      }
    }

    // Apply filtering
    const filteredDispensers = filter === "all"
      ? allDispensers
      : allDispensers.filter((dispenser) =>
        filter === "open"
          ? dispenser.give_remaining > 0
          : dispenser.give_remaining === 0
      );

    console.log(
      `Fetched dispensers for CPID: ${cpid}, Count: ${filteredDispensers.length}`,
    );

    return filteredDispensers;
  }

  static async getAllOpenStampDispensers(page: number = 1, limit: number = 10) {
    // FIXME: this is only returning the event for when they are opened, not all open dispensers
    const endpoint = "/events/OPEN_DISPENSER";
    let allDispensers: any[] = [];
    let cursor: string | null = null;
    const apiLimit = 1000;

    while (true) {
      const queryParams = new URLSearchParams({
        limit: apiLimit.toString(),
      });
      if (cursor) {
        queryParams.append("cursor", cursor);
      }

      try {
        const response = await this.fetchXcpV2WithCache<any>(
          endpoint,
          queryParams,
        );

        if (!response || !Array.isArray(response.result)) {
          break;
        }

        const dispensers = response.result.map((event: any) => ({
          tx_hash: event.tx_hash,
          block_index: event.block_index,
          source: event.params.source,
          cpid: event.params.asset,
          give_quantity: event.params.give_quantity,
          give_remaining: event.params.give_remaining,
          escrow_quantity: event.params.escrow_quantity,
          satoshirate: event.params.satoshirate,
          btcrate: event.params.satoshirate / 100000000,
          origin: event.params.origin,
        }));

        allDispensers = allDispensers.concat(dispensers);

        cursor = response.next_cursor || null;
        if (!cursor) {
          break;
        }
      } catch (error) {
        console.error("Error fetching open dispensers:", error);
        break;
      }
    }

    const assetIds = [
      ...new Set(allDispensers.map((dispenser) => dispenser.cpid)),
    ];

    const stamps = await StampService.getStamps({
      identifier: assetIds,
      allColumns: true,
      noPagination: true,
    });

    // Handle the possibility of `stamps` being `null`
    if (!stamps || !stamps.stamps) {
      throw new Error("Failed to fetch stamps");
    }

    // Explicitly type the `stamp` parameter
    const stampMap = new Map(
      stamps.stamps.map((stamp: { cpid: string }) => [stamp.cpid, stamp]),
    );

    const filteredDispensers = allDispensers.filter((dispenser) =>
      stampMap.has(dispenser.cpid)
    );

    const mappedDispensersPromises = filteredDispensers.map(
      async (dispenser) => {
        const dispenses = await this.getDispensesByCpid(dispenser.cpid);
        return {
          ...dispenser,
          dispenses,
          stamp: stampMap.get(dispenser.cpid),
        };
      },
    );

    const mappedDispensers = await Promise.all(mappedDispensersPromises);

    const total = mappedDispensers.length;
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedDispensers = mappedDispensers.slice(startIndex, endIndex);

    return { total, dispensers: paginatedDispensers };
  }

  static async getDispensesByCpid(cpid: string) {
    const endpoint = `/assets/${cpid}/dispenses`;
    let allDispenses: any[] = [];
    let cursor: string | null = null;
    const limit = 1000;

    console.log(`Fetching dispenses for CPID: ${cpid}`);

    while (true) {
      const queryParams = new URLSearchParams({
        limit: limit.toString(),
        verbose: "true",
      });
      if (cursor) {
        queryParams.append("cursor", cursor);
      }

      try {
        const response = await this.fetchXcpV2WithCache<any>(
          endpoint,
          queryParams,
        );

        if (!response || !Array.isArray(response.result)) {
          console.log(`No more results for CPID: ${cpid}`);
          break;
        }

        const dispenses = response.result.map((dispense: any) => ({
          tx_hash: dispense.tx_hash,
          block_index: dispense.block_index,
          cpid: cpid,
          source: dispense.source,
          destination: dispense.destination,
          dispenser_tx_hash: dispense.dispenser_tx_hash,
          dispense_quantity: dispense.dispense_quantity,
          confirmed: dispense.confirmed,
          btc_amount: dispense.btc_amount_normalized,
          close_block_index: dispense.dispenser?.close_block_index ?? null,
          dispenser_details: dispense.dispenser || null,
        }));

        allDispenses = allDispenses.concat(dispenses);

        if (response.next_cursor && response.next_cursor !== cursor) {
          cursor = response.next_cursor;
          console.log(`New cursor for CPID ${cpid}: ${cursor}`);
        } else {
          console.log(`No more pages for CPID ${cpid}`);
          break;
        }
      } catch (error) {
        console.error(
          `Error fetching dispenses for cpid ${cpid}:`,
          error,
        );
        break;
      }
    }

    console.log(
      `Fetched dispenses for CPID: ${cpid}, Count: ${allDispenses.length}`,
    );

    return allDispenses;
  }
}

export class XcpManager {
  private static fetchXcpV2WithCache = fetchXcpV2WithCache;

  static async getXcpAsset(cpid: string): Promise<any> {
    const endpoint = `/assets/${cpid}`;
    const queryParams = new URLSearchParams();

    console.log(`Fetching XCP asset for CPID: ${cpid}`);

    try {
      const response = await this.fetchXcpV2WithCache<any>(
        endpoint,
        queryParams,
      );

      if (!response || typeof response !== "object") {
        throw new Error(`Invalid response for asset ${cpid}`);
      }

      console.log(
        `Fetched XCP asset for CPID: ${cpid}, Response: ${
          JSON.stringify(response)
        }`,
      );

      return response;
    } catch (error) {
      console.error(`Error fetching asset info for cpid ${cpid}:`, error);
      throw error;
    }
  }

  static async getAllXcpAssets(maxRecords = 1000): Promise<any[]> {
    let allAssets: any[] = [];
    let cursor: string | null = null;
    const endpoint = "/assets";

    console.log(`Starting to fetch XCP assets, max records: ${maxRecords}`);

    do {
      const remainingRecords = maxRecords - allAssets.length;
      const queryLimit = Math.min(remainingRecords, 1000);

      console.log(
        `Fetching batch of assets. Cursor: ${cursor}, Limit: ${queryLimit}`,
      );

      const queryParams = new URLSearchParams({ limit: queryLimit.toString() });
      if (cursor) {
        queryParams.append("cursor", cursor);
      }

      try {
        const response = await this.fetchXcpV2WithCache<any>(
          endpoint,
          queryParams,
        );

        console.log(
          `Received response. Result count: ${response.result?.length}`,
        );

        if (!response || !Array.isArray(response.result)) {
          console.warn("Unexpected response structure:", response);
          break;
        }

        allAssets = allAssets.concat(response.result);
        cursor = response.next_cursor || null;

        console.log(
          `Total assets fetched: ${allAssets.length}, Next cursor: ${cursor}`,
        );

        if (allAssets.length >= maxRecords) {
          console.log(
            `Reached or exceeded maxRecords (${maxRecords}). Stopping.`,
          );
          break;
        }
      } catch (error) {
        console.error("Error fetching assets batch:", error);
        break;
      }
    } while (cursor);

    console.log(
      `Finished fetching XCP assets. Total fetched: ${allAssets.length}`,
    );

    return allAssets.slice(0, maxRecords);
  }

  static async getXcpHoldersByCpid(cpid: string): Promise<any[]> {
    const endpoint = `/assets/${cpid}/balances`;
    let allHolders: any[] = [];
    let cursor: string | null = null;
    const limit = 1000;

    console.log(`Fetching XCP holders for CPID: ${cpid}`);

    while (true) {
      const queryParams = new URLSearchParams({
        limit: limit.toString(),
      });
      if (cursor) {
        queryParams.append("cursor", cursor);
      }

      try {
        const response = await this.fetchXcpV2WithCache<any>(
          endpoint,
          queryParams,
        );

        if (!response || !Array.isArray(response.result)) {
          console.log(`No more results for CPID: ${cpid}`);
          break;
        }

        const holders = response.result
          .filter((holder: any) => holder.quantity > 0)
          .map((holder: any) => ({
            address: holder.address,
            quantity: holder.quantity,
          }));

        allHolders = allHolders.concat(holders);

        if (response.next_cursor && response.next_cursor !== cursor) {
          cursor = response.next_cursor;
          console.log(`New cursor for CPID ${cpid}: ${cursor}`);
        } else {
          console.log(`No more pages for CPID ${cpid}`);
          break;
        }
      } catch (error) {
        console.error(`Error fetching holders for cpid ${cpid}:`, error);
        break;
      }
    }

    console.log(
      `Fetched XCP holders for CPID: ${cpid}, Count: ${allHolders.length}`,
    );

    return allHolders;
  }

  static getXcpBalancesByAddress = async (
    address: string,
    maxIterations = 100,
  ) => {
    const endpoint = `/addresses/${address}/balances`;
    let allBalances: any[] = [];
    let cursor: string | null = null;
    const limit = 1000;
    let iterations = 0;

    console.log(`Fetching XCP balances for address: ${address}`);

    while (iterations < maxIterations) {
      iterations++;
      const queryParams = new URLSearchParams({ limit: limit.toString() });
      if (cursor) {
        queryParams.append("cursor", cursor);
      }

      try {
        const response = await this.fetchXcpV2WithCache<any>(
          endpoint,
          queryParams,
        );

        if (!response || !Array.isArray(response.result)) {
          console.warn(`Unexpected response structure for address ${address}`);
          break;
        }

        const balances = response.result
          .filter((balance: any) => balance.quantity > 0)
          .map((balance: any) => ({
            cpid: balance.asset,
            quantity: balance.quantity,
            divisible: balance.divisible,
          }));

        allBalances = allBalances.concat(balances);

        console.log(
          `Iteration ${iterations}: Fetched ${balances.length} balances. Total: ${allBalances.length}`,
        );

        if (response.next_cursor) {
          cursor = response.next_cursor;
          console.log(`New cursor: ${cursor}`);
        } else {
          console.log("No more pages to fetch");
          break; // No more pages
        }

        if (
          response.result_count && allBalances.length >= response.result_count
        ) {
          console.log(`Fetched all ${response.result_count} balances`);
          break;
        }
      } catch (error) {
        console.error(
          `Error fetching balances for address ${address} (iteration ${iterations}):`,
          error,
        );
        // Implement exponential backoff here if needed
        break;
      }
    }

    if (iterations >= maxIterations) {
      console.warn(
        `Reached maximum iterations (${maxIterations}) for address ${address}. Fetched ${allBalances.length} balances.`,
      );
    } else {
      console.log(
        `Completed fetching balances for address ${address}. Total balances: ${allBalances.length}`,
      );
    }

    return allBalances;
  };

  static async getXcpSendsByCPID(cpid: string): Promise<any[]> {
    const endpoint = `/assets/${cpid}/sends`;
    let allSends: any[] = [];
    let cursor: string | null = null;
    const limit = 1000;

    console.log(`Fetching XCP sends for CPID: ${cpid}`);

    while (true) {
      const queryParams = new URLSearchParams({ limit: limit.toString() });
      if (cursor) {
        queryParams.append("cursor", cursor);
      }

      try {
        const response = await this.fetchXcpV2WithCache<any>(
          endpoint,
          queryParams,
        );

        if (!response || !Array.isArray(response.result)) {
          console.log(`No more results for CPID: ${cpid}`);
          break;
        }

        const sends = response.result.map((send: any) => ({
          tx_hash: send.tx_hash,
          block_index: send.block_index,
          source: send.source,
          destination: send.destination,
          quantity: send.quantity,
          asset: cpid,
          status: send.status,
        }));

        allSends = allSends.concat(sends);

        if (response.next_cursor && response.next_cursor !== cursor) {
          cursor = response.next_cursor;
          console.log(`New cursor for CPID ${cpid}: ${cursor}`);
        } else {
          console.log(`No more pages for CPID ${cpid}`);
          break;
        }
      } catch (error) {
        console.error(`Error fetching sends for cpid ${cpid}:`, error);
        break;
      }
    }

    console.log(
      `Fetched XCP sends for CPID: ${cpid}, Count: ${allSends.length}`,
    );

    return allSends;
  }

  private static getDispenseEvents(
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

    return this.fetchXcpV2WithCache<{
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

  static async getXcpAssetsByCpids(cpids: string[]): Promise<any[]> {
    console.log(`Fetching XCP assets for CPIDs: ${cpids.join(", ")}`);

    const assetPromises = cpids.map((cpid) => this.getXcpAsset(cpid));
    const assets = await Promise.all(assetPromises);

    console.log(`Fetched ${assets.length} XCP assets`);

    return assets.filter((asset) => asset !== null).map((asset) =>
      asset.result
    );
  }
}
