import { StampService } from "$lib/services/stampService.ts";
import { dbManager } from "../../server/database/db.ts";

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

const cacheTimeout: number = 1000 * 60 * 5; // 5 minutes

export async function fetchXcpV2WithCache<T>(
  endpoint: string,
  queryParams: URLSearchParams,
): Promise<T> {
  const cacheKey = `api:v2:${endpoint}:${queryParams.toString()}`;

  return await dbManager.handleCache(
    cacheKey,
    async () => {
      const url = `${xcp_v2_nodes[0].url}${endpoint}?${queryParams.toString()}`;
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    },
    cacheTimeout,
  );
}
// curl -X GET 'https://api.counterparty.io:4000/v2/healthz'
// {"result": {"status": "Healthy"}}%

export class DispenserManager {
  private static cacheTimeout: number = 1000 * 60 * 5; // 5 minutes
  private static fetchXcpV2WithCache = fetchXcpV2WithCache;

  static async getDispensersByCpid(
    cpid: string,
    filter: "open" | "closed" | "all" = "open",
  ): Promise<[]> {
    const endpoint = `/assets/${cpid}/dispensers`;
    let allDispensers: any[] = [];
    let cursor: string | null = null;
    const limit = 1000;

    while (true) {
      const queryParams = new URLSearchParams({
        limit: limit.toString(),
        // verbose: "true",
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
          confirmed: dispenser.confirmed, // whether or not this is in the mempool
          close_block_index: dispenser.close_block_index,
        }));

        allDispensers = allDispensers.concat(dispensers);

        // Check if there's a next cursor
        cursor = response.next_cursor || null;
        if (!cursor) {
          break; // No more pages
        }
      } catch (error) {
        console.error(`Error fetching dispensers for cpid ${cpid}:`, error);
        break;
      }
    }

    const filteredDispensers = filter === "all"
      ? allDispensers
      : allDispensers.filter((dispenser) =>
        filter === "open"
          ? dispenser.give_remaining > 0
          : dispenser.give_remaining === 0
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

    const stampMap = new Map(stamps.stamps.map((stamp) => [stamp.cpid, stamp]));

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
          confirmed: dispense.confirmed, // whether or not this is in the mempool
          btc_amount: dispense.btc_amount_normalized,
          close_block_index: dispense.dispenser.close_block_index,
          dispenser_details: dispense.dispenser,
        }));

        allDispenses = allDispenses.concat(dispenses);

        // Check if there's a next cursor
        cursor = response.next_cursor || null;
        if (!cursor) {
          break; // No more pages
        }
      } catch (error) {
        console.error(
          `Error fetching dispenses for cpid ${cpid}:`,
          error,
        );
        break;
      }
    }

    return allDispenses;
  }
}

export class XcpManager {
  private static fetchXcpV2WithCache = fetchXcpV2WithCache;

  static async getXcpAsset(cpid: string): Promise<any> {
    const endpoint = `/assets/${cpid}`;
    const queryParams = new URLSearchParams();

    try {
      const response = await this.fetchXcpV2WithCache<any>(
        endpoint,
        queryParams,
      );

      if (!response || typeof response !== "object") {
        throw new Error(`Invalid response for asset ${cpid}`);
      }

      return response;
    } catch (error) {
      console.error(`Error fetching asset info for cpid ${cpid}:`, error);
      throw error;
    }
  }

  static async getAllXcpAssets(maxRecords = 1000): Promise<any[]> { // TODO: maxRecords is used for dev testing, remove when we go to production
    let allAssets: any[] = [];
    let cursor: string | null = null;
    const endpoint = "/assets";

    do {
      const remainingRecords = maxRecords - allAssets.length;
      const queryLimit = Math.min(remainingRecords, 1000); // Limit to 1000 per request

      const queryParams = new URLSearchParams({ limit: queryLimit.toString() });
      if (cursor) {
        queryParams.append("cursor", cursor);
      }

      const response = await this.fetchXcpV2WithCache<any>(
        endpoint,
        queryParams,
      );

      if (!response || !Array.isArray(response.result)) {
        break;
      }

      allAssets = allAssets.concat(response.result);
      cursor = response.next_cursor || null;

      // Break the loop if we've reached or exceeded the maxRecords
      if (allAssets.length >= maxRecords) {
        break;
      }
    } while (cursor);

    // Trim the result to exactly maxRecords if we've exceeded it
    return allAssets.slice(0, maxRecords);
  }

  static getXcpHoldersByCpid = async (cpid: string) => {
    const endpoint = `/assets/${cpid}/balances`;
    let allHolders: any[] = [];
    let cursor: string | null = null;
    const limit = 1000;

    while (true) {
      const queryParams = new URLSearchParams({
        limit: limit.toString(),
        // verbose: "true", // Only returns asset_info divisible, locked data (not supply)
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

        const holders = response.result
          .filter((holder: any) => holder.quantity > 0)
          .map((holder: any) => ({
            address: holder.address,
            quantity: holder.quantity,
          }));

        allHolders = allHolders.concat(holders);

        // Check if there's a next cursor
        cursor = response.next_cursor || null;
        if (!cursor) {
          break; // No more pages
        }
      } catch (error) {
        console.error(
          `Error fetching holders for cpid ${cpid}:`,
          error,
        );
        break;
      }
    }

    return allHolders;
  };

  static getXcpBalancesByAddress = async (address: string) => {
    const endpoint = `/addresses/${address}/balances`;
    let allBalances: any[] = [];
    let cursor: string | null = null;
    const limit = 1000;

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

        // Check if there's a next cursor
        cursor = response.next_cursor || null;
        if (!cursor) {
          break; // No more pages
        }
      } catch (error) {
        console.error(
          `Error fetching balances for address ${address}:`,
          error,
        );
        break;
      }
    }

    return allBalances;
  };

  static getXcpSendsByCPID = async (cpid: string) => {
    const endpoint = `/assets/${cpid}/sends`;
    let allSends: any[] = [];
    let cursor: string | null = null;
    const limit = 1000;

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

        // Check if there's a next cursor
        cursor = response.next_cursor || null;
        if (!cursor) {
          break; // No more pages
        }
      } catch (error) {
        console.error(
          `Error fetching sends for cpid ${cpid}:`,
          error,
        );
        break;
      }
    }

    return allSends;
  };

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
}
