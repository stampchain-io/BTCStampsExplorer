// TODO: Move to /server

import { StampService } from "$server/services/stampService.ts";
import { dbManager } from "$server/database/databaseManager.ts";
import { DispenserFilter, DispenseEvent, XcpBalance } from "$types/index.d.ts";
import { formatSatoshisToBTC } from "$lib/utils/formatUtils.ts";
import { SATS_PER_KB_MULTIPLIER } from "$lib/utils/constants.ts";
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
  {
    name: "dev.counterparty.io",
    url: "https://dev.counterparty.io:4000/v2",
  },
];


interface XcpBalanceOptions {
  type?: 'all' | 'send' | 'dispenser' | 'issuance';  // Types of balances
  cursor?: string;      // Last index for cursor-based pagination
  limit?: number;       // Max results per request
  offset?: number;      // Skip count (overrides cursor)
  sort?: string;        // Sort order (overrides cursor)
  verbose?: boolean;    // Include additional info
  showUnconfirmed?: boolean;  // Include mempool results
}

export function normalizeFeeRate(params: {
  satsPerKB?: number;
  satsPerVB?: number;
}): {
  normalizedSatsPerVB: number;
  normalizedSatsPerKB: number;
} {
  let normalizedSatsPerVB: number;
  
  if (params.satsPerVB !== undefined) {
    normalizedSatsPerVB = params.satsPerVB;
  } else if (params.satsPerKB !== undefined) {
    // If satsPerKB/1000 < 1, assume it was intended as sats/vB
    normalizedSatsPerVB = params.satsPerKB < SATS_PER_KB_MULTIPLIER 
      ? params.satsPerKB 
      : params.satsPerKB / SATS_PER_KB_MULTIPLIER;
  } else {
    throw new Error("Either satsPerKB or satsPerVB must be provided");
  }

  if (normalizedSatsPerVB <= 2) {
    throw new Error("Fee rate must be greater than 2 sat/vB");
  }

  return {
    normalizedSatsPerVB,
    normalizedSatsPerKB: normalizedSatsPerVB * SATS_PER_KB_MULTIPLIER
  };
}

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

export class DispenserManager {
  private static fetchXcpV2WithCache = fetchXcpV2WithCache;

  static async getDispensersByCpid(
    cpid: string,
    page?: number,
    limit?: number,
    cacheTimeout?: number,
    filter: DispenserFilter = "all"
  ): Promise<{ dispensers: any[], total: number }> {
    const endpoint = `/assets/${cpid}/dispensers`;

    // Apply filter to API query if possible
    const queryParams = new URLSearchParams({
      limit: limit?.toString() || "50",
      status: filter || 'all'
    });

    try {
      const response = await fetchXcpV2WithCache(
        endpoint,
        queryParams
      );

      if (!response || !Array.isArray(response.result)) {
        return { dispensers: [], total: 0 };
      }

      const dispensers = response.result.map((dispenser: any) => ({
        tx_hash: dispenser.tx_hash,
        block_index: dispenser.block_index,
        source: dispenser.source,
        cpid: dispenser.asset,
        give_quantity: dispenser.give_quantity,
        give_remaining: dispenser.give_remaining,
        escrow_quantity: dispenser.escrow_quantity,
        satoshirate: dispenser.satoshirate,
        btcrate: Number(formatSatoshisToBTC(dispenser.satoshirate, { includeSymbol: false })),
        origin: dispenser.origin,
        confirmed: dispenser.confirmed,
        close_block_index: dispenser.close_block_index,
        status: dispenser.give_remaining > 0 ? "open" : "closed",
        asset_info: dispenser.asset_info,
        dispenser_info: dispenser.dispenser_info
      }));

      // If API doesn't support status filter, apply it client-side
      const filteredDispensers = filter === "all"
        ? dispensers
        : dispensers.filter((dispenser) =>
          filter === "open"
            ? dispenser.give_remaining > 0
            : dispenser.give_remaining === 0
        );

      // If pagination is requested, apply it
      if (page !== undefined && limit !== undefined) {
        const skipCount = (page - 1) * limit;
        const paginatedDispensers = filteredDispensers.slice(skipCount, skipCount + limit);
        return {
          dispensers: paginatedDispensers,
          total: filteredDispensers.length
        };
      }

      // Otherwise return all dispensers
      return {
        dispensers: filteredDispensers,
        total: filteredDispensers.length
      };

    } catch (error) {
      console.error(`Error fetching dispensers for cpid ${cpid}:`, error);
      return { dispensers: [], total: 0 };
    }
  }

  static async getDispensesByCpid(
    cpid: string,
    page: number = 1,
    limit: number = 50,
    cacheTimeout?: number
  ): Promise<{ dispenses: any[], total: number }> {
    const endpoint = `/assets/${cpid}/dispenses`;
    let allDispenses: any[] = [];
    let cursor: string | null = null;

    // Calculate how many items to skip based on page and limit
    const skipCount = (page - 1) * limit;
    let processedCount = 0;

    console.log(`Fetching dispenses for CPID: ${cpid}, Page: ${page}, Limit: ${limit}`);

    while (true) {
      const queryParams = new URLSearchParams({
        limit: limit.toString(),
        verbose: "true",
      });
      if (cursor) {
        queryParams.set("cursor", cursor);
      }

      try {
        const response = await fetchXcpV2WithCache(
          endpoint,
          queryParams
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
        processedCount += dispenses.length;

        // If we have enough items for the requested page, break
        if (allDispenses.length >= skipCount + limit) {
          break;
        }

        // Break if no next cursor or if it's the same as current
        if (!response.next_cursor || response.next_cursor === cursor) {
          break;
        }
        cursor = response.next_cursor;
      } catch (error) {
        console.error(
          `Error fetching dispenses for cpid ${cpid}:`,
          error,
        );
        break;
      }
    }

    // Apply pagination to the collected results
    const paginatedDispenses = allDispenses.slice(skipCount, skipCount + limit);
    const total = allDispenses.length;

    console.log(
      `Fetched dispenses for CPID: ${cpid}, Count: ${total}`,
    );

    return {
      dispenses: paginatedDispenses,
      total
    };
  }
}

// Update only the ComposeAttachOptions interface
export interface ComposeAttachOptions {
  // Required parameters
  fee_per_kb: number;  // Changed from optional to required

  // Optional parameters
  destination_vout?: number;
  inputs_set?: string;  // txid:vout format for specifying UTXO
  encoding?: string;    // default: 'auto'
  regular_dust_size?: number;    // default: 546
  multisig_dust_size?: number;   // default: 1000
  pubkeys?: string;
  allow_unconfirmed_inputs?: boolean;  // default: false
  exact_fee?: number;
  fee_provided?: number;         // default: 0
  unspent_tx_hash?: string;
  dust_return_pubkey?: string | false;
  disable_utxo_locks?: boolean;  // default: false
  p2sh_pretx_txid?: string;
  segwit?: boolean;             // default: false
  confirmation_target?: number;  // default: 3
  exclude_utxos?: string;
  return_psbt?: boolean;        // default: false (API v2 only)
  return_only_data?: boolean;   // default: false (API v2 only)
  extended_tx_info?: boolean;   // default: false (API v1 only)
  old_style_api?: boolean;      // default: false (API v1 only)
  use_utxos_with_balances?: boolean;    // default: false
  exclude_utxos_with_balances?: boolean; // default: false
  validate?: boolean;           // default: true
  verbose?: boolean;            // default: false
  show_unconfirmed?: boolean;   // default: false
}

// Also add ComposeDetachOptions since it's used in stampdetach.ts
export interface ComposeDetachOptions {
  // Required parameters
  fee_per_kb: number;

  // Optional parameters
  destination?: string;
  encoding?: string;
  regular_dust_size?: number;
  multisig_dust_size?: number;
  pubkeys?: string;
  allow_unconfirmed_inputs?: boolean;
  exact_fee?: number;
  fee_provided?: number;
  unspent_tx_hash?: string;
  dust_return_pubkey?: string | false;
  disable_utxo_locks?: boolean;
  p2sh_pretx_txid?: string;
  segwit?: boolean;
  confirmation_target?: number;
  exclude_utxos?: string;
  inputs_set?: string;
  return_psbt?: boolean;
  return_only_data?: boolean;
  extended_tx_info?: boolean;
  old_style_api?: boolean;
  use_utxos_with_balances?: boolean;
  exclude_utxos_with_balances?: boolean;
  validate?: boolean;
  verbose?: boolean;
  show_unconfirmed?: boolean;
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

  static async getXcpHoldersByCpid(
    cpid: string,
    page: number = 1,
    limit: number = 50,
    cacheTimeout?: number
  ): Promise<{ holders: any[], total: number }> {
    const endpoint = `/assets/${cpid}/balances`;
    let allHolders: any[] = [];
    let cursor: string | null = null;
    const apiLimit = 1000;

    // Calculate how many items to skip based on page and limit
    const skipCount = (page - 1) * limit;
    let processedCount = 0;

    console.log(`Fetching XCP holders for CPID: ${cpid}, Page: ${page}, Limit: ${limit}`);

    while (true) {
      const queryParams = new URLSearchParams({
        limit: apiLimit.toString(),
      });
      if (cursor) {
        queryParams.set("cursor", cursor);
      }

      try {
        const response = await fetchXcpV2WithCache(
          endpoint,
          queryParams
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
        processedCount += holders.length;

        // If we have enough items for the requested page, break
        if (allHolders.length >= skipCount + limit) {
          break;
        }

        // Break if no next cursor or if it's the same as current
        if (!response.next_cursor || response.next_cursor === cursor) {
          break;
        }
        cursor = response.next_cursor;
      } catch (error) {
        console.error(`Error fetching holders for cpid ${cpid}:`, error);
        break;
      }
    }

    // Apply pagination to the collected results
    const paginatedHolders = allHolders.slice(skipCount, skipCount + limit);
    const total = allHolders.length;

    return {
      holders: paginatedHolders,
      total
    };
  }


  static async getXcpBalancesByAddress(
    address: string,
    cpid?: string,
    utxoOnly: boolean = false,
    options: XcpBalanceOptions = {}
  ): Promise<{ balances: XcpBalance[]; total: number; next_cursor?: string }> {
    const baseEndpoint = `/addresses/${address}/balances`;
    const endpoint = cpid ? `${baseEndpoint}/${cpid}` : baseEndpoint;
    
    const defaultParams = new URLSearchParams();
    defaultParams.append("type", options.type || "all");
    defaultParams.append("limit", (options.limit || 50).toString());

    // Handle pagination - offset takes precedence over cursor
    if (options.offset !== undefined) {
      defaultParams.append("offset", options.offset.toString());
    } else if (options.cursor) {
      defaultParams.append("cursor", options.cursor);
    }

    // Sort overrides cursor if provided
    if (options.sort) {
      defaultParams.append("sort", options.sort);
    }

    if (options.verbose) {
      defaultParams.append("verbose", "true");
    }
    if (options.showUnconfirmed) {
      defaultParams.append("show_unconfirmed", "true");
    }

    console.log(`[XcpManager] Fetching balances with params:`, Object.fromEntries(defaultParams));

    try {
      const response = await this.fetchXcpV2WithCache<any>(endpoint, defaultParams);

      if (!response) {
        console.warn(`Unexpected response structure for address ${address}`);
        return { balances: [], total: 0 };
      }

      let balances: XcpBalance[];

      if (cpid) {
        // Handle single balance response for specific CPID
        if (response.result && response.result.quantity > 0) {
          balances = [{
            address: response.result.address || null,
            cpid: response.result.asset,
            quantity: response.result.quantity,
            utxo: response.result.utxo || "",
            utxo_address: response.result.utxo_address || "",
            divisible: response.result.divisible || false,
          }];
        } else {
          balances = [];
        }
      } else {
        // Handle multiple balances response
        if (!Array.isArray(response.result)) {
          console.warn(`Unexpected result structure for address ${address}`);
          return { balances: [], total: 0 };
        }
        balances = response.result
          .filter((balance: any) => balance.quantity > 0)
          .map((balance: any) => ({
            address: balance.address || null,
            cpid: balance.asset,
            quantity: balance.quantity,
            utxo: balance.utxo || "",
            utxo_address: balance.utxo_address || "",
            divisible: balance.divisible || false,
          }));
      }

      // Apply UTXO-only filter if requested
      if (utxoOnly) {
        balances = balances.filter((balance) => balance.utxo !== "");
      }

      return { 
        balances,
        total: response.result_count || balances.length,
        next_cursor: response.next_cursor
      };
    } catch (error) {
      console.error(`Error fetching balances for address ${address}:`, error);
      throw error;
    }
  }

  static async getAllXcpBalancesByAddress(
    address: string,
    utxoOnly: boolean = false
  ): Promise<{ balances: XcpBalance[]; total: number }> {
    try {
      const MAX_RETRIES = 3;
      let attempt = 0;
      
      while (attempt < MAX_RETRIES) {
        // First request to get total count and initial data
        const result = await this.getXcpBalancesByAddress(
          address,
          undefined,
          utxoOnly,
          { 
            type: "all",
            limit: 500,
            verbose: true
          }
        );

        console.log(`[XcpManager] Initial fetch - Total expected: ${result.total}, Got: ${result.balances.length}`);

        if (result.total === 0) {
          return { balances: [], total: 0 };
        }

        // Start with initial balances
        let allBalances = [...result.balances];
        let nextCursor = result.next_cursor;
        let lastLength = allBalances.length;
        let noProgressCount = 0;

        while (nextCursor && allBalances.length < result.total) {
          console.log(`[XcpManager] Fetching next page with cursor: ${nextCursor}, current count: ${allBalances.length}`);
          
          const pageResult = await this.getXcpBalancesByAddress(
            address,
            undefined,
            utxoOnly,
            { 
              type: "all",
              limit: 500,
              cursor: nextCursor,
              verbose: true
            }
          );

          if (!pageResult.balances.length) {
            console.log(`[XcpManager] No more balances returned`);
            break;
          }

          allBalances = [...allBalances, ...pageResult.balances];
          nextCursor = pageResult.next_cursor;

          // Check if we're making progress
          if (allBalances.length === lastLength) {
            noProgressCount++;
            if (noProgressCount > 3) {
              console.warn(`[XcpManager] No progress after 3 attempts, breaking pagination`);
              break;
            }
          } else {
            noProgressCount = 0;
            lastLength = allBalances.length;
          }

          console.log(`[XcpManager] Progress: ${allBalances.length}/${result.total}`);
        }

        // Verify we got expected number of results
        if (allBalances.length >= result.total * 0.9) { // Allow 10% margin
          console.log(`[XcpManager] Successfully fetched ${allBalances.length} balances`);
          return { balances: allBalances, total: result.total };
        }

        console.warn(
          `[XcpManager] Got ${allBalances.length} balances but expected ${result.total}, retrying...`
        );
        attempt++;
        
        if (attempt < MAX_RETRIES) {
          await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
        }
      }

      throw new Error(`Failed to fetch complete balance set after ${MAX_RETRIES} attempts`);
    } catch (error) {
      console.error(`Error fetching all balances for address ${address}:`, error);
      throw error;
    }
  }

  static async getXcpSendsByCPID(
    cpid: string,
    page: number = 1,
    limit: number = 50,
    cacheTimeout?: number
  ): Promise<{ sends: any[], total: number }> {
    const endpoint = `/assets/${cpid}/sends`;
    let allSends: any[] = [];
    let cursor: string | null = null;
    const apiLimit = 1000;

    // Calculate how many items to skip based on page and limit
    const skipCount = (page - 1) * limit;
    let processedCount = 0;

    console.log(`Fetching XCP sends for CPID: ${cpid}, Page: ${page}, Limit: ${limit}`);

    while (true) {
      const queryParams = new URLSearchParams({
        limit: apiLimit.toString(),
      });
      if (cursor) {
        queryParams.set("cursor", cursor);
      }

      try {
        const response = await fetchXcpV2WithCache(
          endpoint,
          queryParams
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
        processedCount += sends.length;

        // If we have enough items for the requested page, break
        if (allSends.length >= skipCount + limit) {
          break;
        }

        // Break if no next cursor or if it's the same as current
        if (!response.next_cursor || response.next_cursor === cursor) {
          break;
        }
        cursor = response.next_cursor;
      } catch (error) {
        console.error(`Error fetching sends for cpid ${cpid}:`, error);
        break;
      }
    }

    // Apply pagination to the collected results
    const paginatedSends = allSends.slice(skipCount, skipCount + limit);
    const total = allSends.length;

    console.log(
      `Fetched XCP sends for CPID: ${cpid}, Count: ${total}`,
    );

    return {
      sends: paginatedSends,
      total
    };
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
          const isValid = (
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

          if (isValid) {
            // Convert btc_amount to BTC if it's in satoshis
            event.params.btc_amount = Number(formatSatoshisToBTC(event.params.btc_amount, {
              includeSymbol: false,
              stripZeros: false
            }));
          }

          return isValid;
        }
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

  static async createDispense(
    address: string,
    dispenser: string,
    quantity: number,
    options: {
      encoding?: string;
      fee_per_kb?: number;
      regular_dust_size?: number;
      multisig_dust_size?: number;
      pubkeys?: string;
      allow_unconfirmed_inputs?: boolean;
      exact_fee?: number;
      fee_provided?: number;
      unspent_tx_hash?: string;
      dust_return_pubkey?: string;
      disable_utxo_locks?: boolean;
      p2sh_pretx_txid?: string;
      segwit?: boolean;
      confirmation_target?: number;
      exclude_utxos?: string;
      inputs_set?: string;
      return_psbt?: boolean;
      return_only_data?: boolean;
      extended_tx_info?: boolean;
      old_style_api?: boolean;
      verbose?: boolean;
      show_unconfirmed?: boolean;
    } = {},
  ): Promise<any> {
    const endpoint = `/addresses/${address}/compose/dispense`;
    const queryParams = new URLSearchParams();

    queryParams.append("dispenser", dispenser);
    queryParams.append("quantity", quantity.toString());
    
    // Set default dust size if not provided
    if (!options.regular_dust_size) {
      queryParams.append("regular_dust_size", "546"); // Bitcoin's standard dust limit
    }

    // Append optional parameters if provided
    for (const [key, value] of Object.entries(options)) {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    }

    let lastError: string | null = null;

    for (const node of xcp_v2_nodes) {
      const url = `${node.url}${endpoint}?${queryParams.toString()}`;
      console.log(`Attempting to fetch from URL: ${url}`);

      try {
        const response = await fetch(url);
        console.log(`Response status from ${node.name}: ${response.status}`);

        if (!response.ok) {
          const errorBody = await response.text();
          console.error(`Error response body from ${node.name}: ${errorBody}`);
          try {
            const errorJson = JSON.parse(errorBody);
            if (errorJson.error) {
              lastError = errorJson.error;
            }
          } catch (e) {
            lastError = errorBody;
          }
          continue; // Try the next node
        }

        const data = await response.json();
        console.log(`Successful response from ${node.name}`);
        return data;
      } catch (error) {
        console.error(`Fetch error for ${url}:`, error);
        lastError = error.message;
      }
    }

    // Throw the last error message instead of generic message
    throw new Error(lastError || "All nodes failed to compose dispense transaction.");
  }

  static async composeAttach(
    address: string,
    asset: string,
    quantity: number,
    options: ComposeAttachOptions = {},
  ): Promise<any> {
    const endpoint = `/addresses/${address}/compose/attach`;
    const queryParams = new URLSearchParams();

    // Required parameters
    queryParams.append("asset", asset);
    queryParams.append("quantity", quantity.toString());

    // Default values
    queryParams.append("multisig_dust_size", "788");
    queryParams.append("return_psbt", "true");
    queryParams.append("verbose", "true");

    // The API expects sat/kB
    if (options.fee_per_kb) {
      console.log(`Setting fee rate to ${options.fee_per_kb} sat/kB`);
      queryParams.append(
        "fee_per_kb",
        Math.floor(options.fee_per_kb).toString(),
      );
    }

    // Handle segwit addresses
    if (address.startsWith("bc1")) {
      queryParams.append("segwit", "true");
    }

    // Append all provided options to query parameters, except fee_per_kb which we handled above
    for (const [key, value] of Object.entries(options)) {
      if (value !== undefined && value !== null && key !== 'fee_per_kb') {
        queryParams.append(key, value.toString());
      }
    }

    let lastError: string | null = null;

    for (const node of xcp_v2_nodes) {
      const url = `${node.url}${endpoint}?${queryParams.toString()}`;
      console.log(`Attempting to fetch from URL: ${url}`);

      try {
        const response = await fetch(url);
        console.log(`Response status from ${node.name}: ${response.status}`);

        if (!response.ok) {
          const errorBody = await response.text();
          console.error(`Error response body from ${node.name}: ${errorBody}`);

          try {
            const errorJson = JSON.parse(errorBody);
            if (errorJson.error) {
              // Store the error message but clean it up first
              const errorMessage = errorJson.error;
              if (errorMessage.includes("Insufficient BTC")) {
                // Extract just the relevant part of the error message
                const match = errorMessage.match(
                  /Insufficient BTC at address .+? Need: .+? BTC \(Including fee: .+? BTC\), available: .+? BTC/,
                );
                if (match) {
                  lastError = match[0];
                } else {
                  lastError = errorMessage;
                }
                throw new Error(lastError);
              }
            }
          } catch (parseError) {
            // If JSON parsing fails, continue to next node
            continue;
          }
          continue;
        }

        const data = await response.json();
        console.log(`Successful response from ${node.name}`, data);
        return data;
      } catch (error) {
        // If this is an insufficient funds error, throw it immediately
        if (
          error instanceof Error && error.message.includes("Insufficient BTC")
        ) {
          throw error;
        }
        // Otherwise log and continue to next node
        console.error(`Fetch error for ${url}:`, error);
      }
    }

    // If we have a stored error message, throw that instead of generic message
    if (lastError) {
      throw new Error(lastError);
    }

    // Only throw generic error if all nodes fail and no specific error was caught
    throw new Error("All nodes failed to compose attach transaction.");
  }

  static async composeDetach(
    utxo: string,
    destination: string,
    options: ComposeDetachOptions = {},
  ): Promise<any> {
    const endpoint = `/utxos/${utxo}/compose/detach`;
    const queryParams = new URLSearchParams();

    // Required parameters
    if (destination) {
      queryParams.append("destination", destination);
    }

    // Default values
    queryParams.append("return_psbt", "true");
    queryParams.append("verbose", "true");

    // The API expects sat/kB
    if (options.fee_per_kb) {
      console.log(`Setting fee rate to ${options.fee_per_kb} sat/kB`);
      queryParams.append(
        "fee_per_kb",
        Math.floor(options.fee_per_kb).toString(),
      );
    }

    // Append all provided options to query parameters, except fee_per_kb which we handled above
    for (const [key, value] of Object.entries(options)) {
      if (value !== undefined && value !== null && key !== 'fee_per_kb') {
        queryParams.append(key, value.toString());
      }
    }

    let lastError: string | null = null;

    for (const node of xcp_v2_nodes) {
      const url = `${node.url}${endpoint}?${queryParams.toString()}`;
      console.log(`Attempting to fetch from URL: ${url}`);

      try {
        const response = await fetch(url);
        console.log(`Response status from ${node.name}: ${response.status}`);

        if (!response.ok) {
          const errorBody = await response.text();
          console.error(`Error response body from ${node.name}: ${errorBody}`);
          try {
            const errorJson = JSON.parse(errorBody);
            if (errorJson.error) {
              lastError = errorJson.error;
            }
          } catch (e) {
            lastError = errorBody;
          }
          continue;
        }

        const data = await response.json();
        console.log(`Successful response from ${node.name}`);
        return data;
      } catch (error) {
        console.error(`Fetch error for ${url}:`, error);
        lastError = error.message;
      }
    }

    throw new Error(lastError || "All nodes failed to compose detach transaction.");
  }

  static async composeDispenser(
    address: string,
    asset: string,
    give_quantity: number,
    escrow_quantity: number,
    mainchainrate: number,
    status: number,
    options: {
      open_address?: string;
      oracle_address?: string;
      encoding?: string;
      fee_per_kb?: number;
      regular_dust_size?: number;
      multisig_dust_size?: number;
      pubkeys?: string;
      allow_unconfirmed_inputs?: boolean;
      exact_fee?: number;
      fee_provided?: number;
      unspent_tx_hash?: string;
      dust_return_pubkey?: string;
      disable_utxo_locks?: boolean;
      p2sh_pretx_txid?: string;
      segwit?: boolean;
      confirmation_target?: number;
      exclude_utxos?: string;
      inputs_set?: string;
      return_psbt?: boolean;
      return_only_data?: boolean;
      extended_tx_info?: boolean;
      old_style_api?: boolean;
      verbose?: boolean;
      show_unconfirmed?: boolean;
    } = {},
  ): Promise<any> {
    const endpoint = `/addresses/${address}/compose/dispenser`;
    const queryParams = new URLSearchParams();

    queryParams.append("asset", asset);
    queryParams.append("give_quantity", give_quantity.toString());
    queryParams.append("escrow_quantity", escrow_quantity.toString());
    queryParams.append("mainchainrate", mainchainrate.toString());
    queryParams.append("status", status.toString());

    if (options.open_address) {
      queryParams.append("open_address", options.open_address);
    }
    if (options.oracle_address) {
      queryParams.append("oracle_address", options.oracle_address);
    }

    // Append other optional parameters if provided
    for (const [key, value] of Object.entries(options)) {
      if (
        value !== undefined &&
        value !== null &&
        key !== "open_address" &&
        key !== "oracle_address"
      ) {
        queryParams.append(key, value.toString());
      }
    }

    for (const node of xcp_v2_nodes) {
      const url = `${node.url}${endpoint}?${queryParams.toString()}`;
      console.log(`Attempting to fetch from URL: ${url}`);

      try {
        const response = await fetch(url);
        console.log(`Response status from ${node.name}: ${response.status}`);

        if (!response.ok) {
          const errorBody = await response.text();
          console.error(`Error response body from ${node.name}: ${errorBody}`);
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

    throw new Error("All nodes failed to compose dispenser transaction.");
  }

  static async composeFairmint(
    address: string,
    asset: string,
    quantity: number,
    options: {
      encoding?: string;
      fee_per_kb?: number;
      regular_dust_size?: number;
      multisig_dust_size?: number;
      pubkeys?: string;
      // Default allow_unconfirmed_inputs to true
      allow_unconfirmed_inputs?: boolean;
      exact_fee?: number;
      fee_provided?: number;
      unspent_tx_hash?: string;
      dust_return_pubkey?: string;
      disable_utxo_locks?: boolean;
      p2sh_pretx_txid?: string;
      segwit?: boolean;
      confirmation_target?: number;
      exclude_utxos?: string;
      inputs_set?: string;
      return_psbt?: boolean;
      return_only_data?: boolean;
      extended_tx_info?: boolean;
      old_style_api?: boolean;
      verbose?: boolean;
      show_unconfirmed?: boolean;
    } = {},
  ): Promise<any> {
    const endpoint = `/addresses/${address}/compose/fairmint`;
    const queryParams = new URLSearchParams();

    queryParams.append("asset", asset);
    queryParams.append("quantity", quantity.toString());

    // Set default options
    options.allow_unconfirmed_inputs = options.allow_unconfirmed_inputs ?? true;
    options.return_psbt = options.return_psbt ?? true;

    // Append optional parameters
    for (const [key, value] of Object.entries(options)) {
      if (value !== undefined && value !== null) {
        queryParams.append(key, value.toString());
      }
    }

    for (const node of xcp_v2_nodes) {
      const url = `${node.url}${endpoint}?${queryParams.toString()}`;
      console.log(`Attempting to fetch from URL: ${url}`);

      try {
        const response = await fetch(url);
        console.log(`Response status from ${node.name}: ${response.status}`);

        if (!response.ok) {
          const errorBody = await response.text();
          console.error(`Error response body from ${node.name}: ${errorBody}`);
          continue; // Try the next node
        }

        const data = await response.json();
        console.log(`Successful response from ${node.name}`, data);
        return data;
      } catch (error) {
        console.error(`Fetch error for ${url}:`, error);
        // Continue to the next node
      }
    }

    throw new Error("All nodes failed to compose fairmint transaction.");
  }

  static async getFairminters(): Promise<Fairminter[]> {
    const endpoint = "/fairminters";
    let allFairminters: Fairminter[] = [];
    let cursor: string | null = null;
    const limit = 1000;

    while (true) {
      const queryParams = new URLSearchParams({
        limit: limit.toString(),
      });
      if (cursor) {
        queryParams.set("cursor", cursor);
      }

      try {
        const response = await this.fetchXcpV2WithCache<any>(
          endpoint,
          queryParams,
        );

        if (!response || !Array.isArray(response.result)) {
          console.log("No more results for fairminters");
          break;
        }

        const fairminters = response.result.map((entry: any) => ({
          tx_hash: entry.tx_hash,
          tx_index: entry.tx_index,
          block_index: entry.block_index,
          source: entry.source,
          asset: entry.asset,
          asset_parent: entry.asset_parent,
          asset_longname: entry.asset_longname,
          description: entry.description,
          price: entry.price,
          quantity_by_price: entry.quantity_by_price,
          hard_cap: entry.hard_cap,
          burn_payment: entry.burn_payment,
          max_mint_per_tx: entry.max_mint_per_tx,
          premint_quantity: entry.premint_quantity,
          start_block: entry.start_block,
          end_block: entry.end_block,
          minted_asset_commission_int: entry.minted_asset_commission_int,
          soft_cap: entry.soft_cap,
          soft_cap_deadline_block: entry.soft_cap_deadline_block,
          lock_description: entry.lock_description,
          lock_quantity: entry.lock_quantity,
          divisible: entry.divisible,
          pre_minted: entry.pre_minted,
          status: entry.status,
          paid_quantity: entry.paid_quantity,
          confirmed: entry.confirmed,
        }));

        allFairminters = allFairminters.concat(fairminters);

        // Break if no next cursor or if it's the same as current
        if (!response.next_cursor || response.next_cursor === cursor) {
          console.log("No more pages for fairminters");
          break;
        }
        cursor = response.next_cursor;
      } catch (error) {
        console.error("Error fetching fairminters:", error);
        break;
      }
    }

    console.log(`Fetched fairminters, Count: ${allFairminters.length}`);

    return allFairminters;
  }

  static async createIssuance(
    address: string,
    asset: string,
    quantity: number,
    options: IssuanceOptions = {}
  ): Promise<any> {
    // Validate address (sourceWallet in original)
    if (typeof address !== "string") {
      throw new Error("Invalid address parameter. Expected a string.");
    }

    // Validate asset (assetName in original)
    if (asset !== undefined && typeof asset !== "string") {
      throw new Error("Invalid asset parameter. Expected a string or undefined.");
    }

    // Validate quantity (qty in original)
    const validatedQuantity = typeof quantity === "string" ? Number(quantity) : quantity;
    if (isNaN(validatedQuantity) || !Number.isInteger(validatedQuantity) || validatedQuantity <= 0) {
      throw new Error("Invalid quantity parameter. Expected a positive integer.");
    }

    // Validate options
    if (options.lock !== undefined && typeof options.lock !== "boolean") {
      throw new Error("Invalid lock parameter. Expected a boolean.");
    }
    if (options.divisible !== undefined && typeof options.divisible !== "boolean") {
      throw new Error("Invalid divisible parameter. Expected a boolean.");
    }
    if (options.description !== undefined && typeof options.description !== "string") {
      throw new Error("Invalid description parameter. Expected a string.");
    }

    // Validate fee_per_kb (satsPerKB in original)
    const feePerKB = typeof options.fee_per_kb === "string" 
      ? Number(options.fee_per_kb) 
      : options.fee_per_kb;
    if (feePerKB !== undefined && (isNaN(feePerKB) || feePerKB <= 0)) {
      throw new Error("Invalid fee_per_kb parameter. Expected a positive number.");
    }

    const endpoint = `/addresses/${address}/compose/issuance`;
    const queryParams = new URLSearchParams();

    // Add required parameters
    queryParams.append("asset", asset);
    queryParams.append("quantity", validatedQuantity.toString());
    
    // Always set encoding to OP_RETURN for CIP33
    queryParams.append("encoding", "opreturn");

    // Add optional parameters if they exist
    for (const [key, value] of Object.entries(options)) {
      if (value !== undefined && key !== 'encoding') { // Skip encoding as we set it above
        queryParams.append(key, value.toString());
      }
    }

    // Set defaults for issuance
    if (options.return_psbt === undefined) {
      queryParams.append("return_psbt", "true");
    }
    if (options.verbose === undefined) {
      queryParams.append("verbose", "true");
    }
    if (options.allow_unconfirmed_inputs === undefined) {
      queryParams.append("allow_unconfirmed_inputs", "true");
    }

    // Use the existing cache mechanism
    try {
      return await this.fetchXcpV2WithCache<any>(endpoint, queryParams);
    } catch (error) {
      console.error("Error in createIssuance:", error);
      if (error.message?.includes("Insufficient")) {
        throw error;
      }
      if (error.message?.includes("invalid base58")) {
        throw new Error("Invalid address format. Please use a supported Bitcoin address format.");
      }
      throw new Error(error.message || "Failed to create issuance transaction");
    }
  }

  static async getAssetInfo(asset: string): Promise<any> {
    const endpoint = `/assets/${asset}`;
    const queryParams = new URLSearchParams({
      verbose: "true"
    });

    try {
      for (const node of xcp_v2_nodes) {
        const url = `${node.url}${endpoint}?${queryParams.toString()}`;
        console.log(`Attempting to fetch from URL: ${url}`);

        try {
          const response = await fetch(url);
          console.log(`Response status from ${node.name}: ${response.status}`);

          // If asset doesn't exist, continue to next node
          if (response.status === 404) {
            continue;
          }

          if (!response.ok) {
            const errorBody = await response.text();
            console.error(`Error response body from ${node.name}: ${errorBody}`);
            continue;
          }

          const data = await response.json();
          if (data && data.result) {
            return data.result;
          }
        } catch (error) {
          console.error(`Fetch error for ${url}:`, error);
          continue;
        }
      }

      // If we get here, the asset wasn't found on any node
      return null;
    } catch (error) {
      console.error(`Error fetching asset info for ${asset}:`, error);
      throw error; // Throw non-404 errors
    }
  }

  static async getDispensersByAddress(
    address: string,
    options: {
      status?: string;
      cursor?: string;
      limit?: number;
      page?: number;
      offset?: number;
      sort?: string;
      verbose?: boolean;
      show_unconfirmed?: boolean;
    } = {}
  ): Promise<{ dispensers: Dispenser[]; total: number }> {
    const endpoint = `/addresses/${address}/dispensers`;
    const queryParams = new URLSearchParams();

    // Add optional parameters if they exist
    if (options.status) queryParams.append('status', options.status);
    if (options.cursor) queryParams.append('cursor', options.cursor);
    if (options.limit) queryParams.append('limit', options.limit.toString());
    if (options.offset) queryParams.append('offset', options.offset.toString());
    if (options.sort) queryParams.append('sort', options.sort);
    if (options.verbose) queryParams.append('verbose', 'true');
    if (options.show_unconfirmed) queryParams.append('show_unconfirmed', 'true');

    // Handle pagination
    const page = options.page || 1;
    const limit = options.limit || 50;
    const skipCount = (page - 1) * limit;

    try {
      const response = await this.fetchXcpV2WithCache<any>(endpoint, queryParams);
      
      if (!response || !Array.isArray(response.result)) {
        return {
          dispensers: [],
          total: 0
        };
      }

      const dispensers = response.result.map((dispenser: any) => ({
        tx_hash: dispenser.tx_hash,
        block_index: dispenser.block_index,
        source: dispenser.source,
        cpid: dispenser.asset,
        give_quantity: dispenser.give_quantity,
        give_remaining: dispenser.give_remaining,
        escrow_quantity: dispenser.escrow_quantity,
        satoshirate: dispenser.satoshirate,
        btcrate: Number(formatSatoshisToBTC(dispenser.satoshirate, { includeSymbol: false })),
        origin: dispenser.origin,
        confirmed: dispenser.confirmed,
        close_block_index: dispenser.close_block_index,
        status: String(dispenser.status || "unknown").toLowerCase(),
        asset_info: dispenser.asset_info,
        dispenser_info: dispenser.dispenser_info
      }));

      // Apply pagination
      const paginatedDispensers = dispensers.slice(skipCount, skipCount + limit);

      return {
        dispensers: paginatedDispensers,
        total: dispensers.length
      };
    } catch (error) {
      console.error(`Error fetching dispensers for address ${address}:`, error);
      return {
        dispensers: [],
        total: 0
      };
    }
  }

  static async checkHealth(): Promise<boolean> {
    const endpoint = "/healthz";
    const queryParams = new URLSearchParams();

    try {
      const response = await fetchXcpV2WithCache<{ result: { status: string } }>(
        endpoint,
        queryParams
      );

      return response?.result?.status === "Healthy";
    } catch (error) {
      console.error("XCP health check failed:", error);
      return false;
    }
  }
}

