/**
 * @fileoverview Dependency-Injected XcpManager with abstracted dependencies
 * Enables better testing, flexibility, and maintainability
 */

import type { HttpClient } from "$server/interfaces/httpClient.ts";
import type { CacheService } from "$server/interfaces/cacheService.ts";
import type { XcpBalance } from "$types/index.d.ts";
import { SATS_PER_KB_MULTIPLIER } from "$lib/utils/constants.ts";

// Core configuration interface
export interface XcpManagerConfig {
  nodes: Array<{
    name: string;
    url: string;
  }>;
  defaultCacheTimeout: number;
  maxRetries: number;
  retryDelay: number;
  requestTimeout: number;
}

// Dependencies interface
export interface XcpManagerDependencies {
  httpClient: HttpClient;
  cacheService: CacheService;
  logger: LoggerService;
  config: XcpManagerConfig;
}

// Logger interface for dependency injection
export interface LoggerService {
  info(category: string, data: any): Promise<void>;
  debug(category: string, data: any): Promise<void>;
  warn(category: string, data: any): Promise<void>;
  error(category: string, data: any): Promise<void>;
}

// Balance options interface
export interface XcpBalanceOptions {
  type?: 'all' | 'send' | 'dispenser' | 'issuance';
  cursor?: string;
  limit?: number;
  offset?: number;
  sort?: string;
  verbose?: boolean;
  showUnconfirmed?: boolean;
}

// Compose options interfaces
export interface ComposeAttachOptions {
  fee_per_kb?: number;
  destination_vout?: number;
  inputs_set?: string;
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

export interface ComposeDetachOptions {
  fee_per_kb?: number;
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

export interface IssuanceOptions {
  divisible?: boolean;
  source?: string;
  allow_unconfirmed_inputs?: boolean;
  fee_per_kb?: number;
  fee?: number;
  encoding?: string;
  pubkeys?: string;
  return_psbt?: boolean;
  extended_tx_info?: boolean;
  old_style_api?: boolean;
  verbose?: boolean;
  show_unconfirmed?: boolean;
  lock?: boolean;
  description?: string;
}

// Default configuration
const DEFAULT_CONFIG: Partial<XcpManagerConfig> = {
  nodes: [
    {
      name: "counterparty.io",
      url: "https://api.counterparty.io:4000/v2",
    },
    {
      name: "dev.counterparty.io", 
      url: "https://api.counterparty.io:4000/v2",
    },
  ],
  defaultCacheTimeout: 300, // 5 minutes
  maxRetries: 3,
  retryDelay: 1000,
  requestTimeout: 30000,
};

export class XcpManagerDI {
  private config: XcpManagerConfig;

  constructor(private dependencies: XcpManagerDependencies) {
    this.config = { ...DEFAULT_CONFIG, ...dependencies.config } as XcpManagerConfig;
    
    // Validate configuration
    if (!this.config.nodes || this.config.nodes.length === 0) {
      throw new Error("XCP Manager configuration requires at least one node");
    }
  }

  /**
   * Utility function to normalize fee rates
   */
  normalizeFeeRate(params: {
    satsPerKB?: number;
    satsPerVB?: number;
  }): {
    normalizedSatsPerVB: number;
    normalizedSatsPerKB: number;
  } {
    let normalizedSatsPerVB: number;
    
    try {
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

      if (normalizedSatsPerVB < 0.1) {
        throw new Error("Fee rate must be at least 0.1 sat/vB");
      }

      return {
        normalizedSatsPerVB,
        normalizedSatsPerKB: normalizedSatsPerVB * SATS_PER_KB_MULTIPLIER
      };
    } catch (error) {
      throw error instanceof Error ? error.message : String(error);
    }
  }

  /**
   * Fetch XCP V2 API with caching and node failover
   */
  async fetchXcpV2WithCache<T>(
    endpoint: string,
    queryParams: URLSearchParams,
    customCacheTimeout?: number,
  ): Promise<T> {
    const cacheKey = `api:v2:${endpoint}:${queryParams.toString()}`;
    const cacheTimeout = customCacheTimeout || this.config.defaultCacheTimeout;

    await this.dependencies.logger.info("api", {
      message: "Fetching XCP V2 with cache",
      endpoint,
      queryParams: queryParams.toString(),
      cacheKey,
      cacheTimeout
    });

    return await this.dependencies.cacheService.get(
      cacheKey,
      async () => {
        let errorMessage = null;
        
        for (const node of this.config.nodes) {
          const url = `${node.url}${endpoint}?${queryParams.toString()}`;
          
          await this.dependencies.logger.debug("api", {
            message: "Attempting XCP node fetch",
            node: node.name,
            url,
            endpoint,
            queryParams: queryParams.toString()
          });

          try {
            const response = await this.dependencies.httpClient.get(url, {
              timeout: this.config.requestTimeout,
            });
            
            await this.dependencies.logger.debug("api", {
              message: "XCP node response received",
              node: node.name,
              status: response.status,
              ok: response.ok,
              url
            });

            if (!response.ok) {
              const errorBody = response.data ? String(response.data) : `HTTP ${response.status}`;
              await this.dependencies.logger.error("api", {
                message: "XCP node error response",
                node: node.name,
                status: response.status,
                errorBody,
                url
              });
              errorMessage = errorBody;
              continue; // Try the next node
            }

            await this.dependencies.logger.debug("api", {
              message: "XCP node successful response",
              node: node.name,
              url
            });
            return response.data;
          } catch (error) {
            await this.dependencies.logger.error("api", {
              message: "XCP node fetch error",
              node: node.name,
              error: error instanceof Error ? error.message : String(error),
              url,
              stack: error instanceof Error ? error.stack : undefined
            });
            errorMessage = error instanceof Error ? error.message : String(error);
            // Continue to the next node
          }
        }

        // If all nodes fail, return a minimal data structure
        await this.dependencies.logger.warn("api", {
          message: "All XCP nodes failed, returning minimal data structure",
          endpoint,
          queryParams: queryParams.toString(),
          error: errorMessage
        });
        
        return {
          result: [],
          next_cursor: null,
          result_count: 0,
          error: errorMessage
        } as T;
      },
      { ttl: cacheTimeout },
    );
  }

  /**
   * Get XCP asset information
   */
  async getXcpAsset(cpid: string): Promise<any> {
    const endpoint = `/assets/${cpid}`;
    const queryParams = new URLSearchParams();

    await this.dependencies.logger.debug("api", {
      message: "Fetching XCP asset",
      cpid
    });

    try {
      const response = await this.fetchXcpV2WithCache<any>(
        endpoint,
        queryParams,
      );

      if (!response || typeof response !== "object") {
        throw new Error(`Invalid response for asset ${cpid}`);
      }

      await this.dependencies.logger.debug("api", {
        message: "Fetched XCP asset",
        cpid,
        hasResult: !!response.result
      });

      return response;
    } catch (error) {
      await this.dependencies.logger.error("api", {
        message: "Error fetching asset info",
        cpid,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Get XCP balances by address with pagination
   */
  async getXcpBalancesByAddress(
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

    // Handle pagination options
    if (options.cursor) {
        defaultParams.append("cursor", options.cursor);
    }
    if (options.verbose) {
        defaultParams.append("verbose", "true");
    }

    await this.dependencies.logger.debug("api", {
        message: "[XcpManagerDI] Fetching balances",
        endpoint,
        params: Object.fromEntries(defaultParams),
        address
    });

    try {
        const response = await this.fetchXcpV2WithCache<any>(endpoint, defaultParams);

        if (!response || !response.result) {
            await this.dependencies.logger.warn("api", {
                message: "Unexpected response structure",
                address,
                response
            });
            return { balances: [], total: 0 };
        }

        // Handle the response based on whether it's a single balance or multiple balances
        let balances: XcpBalance[] = [];
        let total = 0;

        if (Array.isArray(response.result)) {
            const balanceMap = new Map<string, XcpBalance>();

            response.result
                .filter((balance: any) => balance.quantity > 0)
                .forEach((balance: any,index:number) => {
                    const effectiveAddress = balance.address || balance.utxo_address;
                    
                    if (effectiveAddress) {
                        const key = `${effectiveAddress}-${balance.asset}-${index}`;
                        const existing = balanceMap.get(key);
                        
                        if (existing) {
                            existing.quantity += balance.quantity;
                        } else {
                            balanceMap.set(key, {
                                address: effectiveAddress,
                                cpid: balance.asset,
                                quantity: balance.quantity,
                                utxo: balance.utxo || "",
                                utxo_address: balance.utxo_address || "",
                                divisible: balance.divisible || false,
                            });
                        }
                    }
                });

            balances = Array.from(balanceMap.values());
            total = balances.length;
        } else if (response.result.quantity > 0) {
            // Single balance response
            balances = [{
                address: response.result.address || response.result.utxo_address,
                cpid: response.result.asset,
                quantity: response.result.quantity,
                utxo: response.result.utxo || "",
                utxo_address: response.result.utxo_address || "",
                divisible: response.result.divisible || false,
            }];
            total = 1;
        }

        // Apply UTXO-only filter if requested
        if (utxoOnly) {
            balances = balances.filter(balance => balance.utxo !== "");
        }

        await this.dependencies.logger.debug("api", {
            message: "[XcpManagerDI] Balances fetched",
            balancesCount: balances.length,
            total,
            nextCursor: response.next_cursor,
            address
        });

        return {
            balances,
            total: response.total || total, // Use response.total if available
            next_cursor: response.next_cursor
        };
    } catch (error) {
        await this.dependencies.logger.error("api", {
            message: "Error fetching balances",
            error: error instanceof Error ? error.message : String(error),
            address,
            stack: error instanceof Error ? error.stack : undefined
        });
        throw error;
    }
  }

  /**
   * Get all XCP balances by address (fetches all pages)
   */
  async getAllXcpBalancesByAddress(
    address: string,
    utxoOnly: boolean = false
  ): Promise<{ balances: XcpBalance[]; total: number }> {
    try {
      const MAX_RETRIES = 3;
      let lastError: Error | null = null;
      
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          await this.dependencies.logger.info("api", {
          message: "[XcpManagerDI] Starting balance fetch attempt",
          attempt: attempt + 1,
          maxRetries: MAX_RETRIES,
          address,
          utxoOnly
        });

        // Initialize collection for all balances
        let allBalances: XcpBalance[] = [];
        let cursor: string | null = null;
        let expectedTotal: number | null = null;
        
        do {
          // Prepare options for each request
          const options: XcpBalanceOptions = {
            type: "all",
            limit: 500,
            verbose: true
          };
          
          if (cursor) {
            options.cursor = cursor;
          }

          const result = await this.getXcpBalancesByAddress(
            address,
            undefined,
            utxoOnly,
            options
          );

          // Set expected total from first response's aggregated count
          if (expectedTotal === null) {
            expectedTotal = result.total;
          }

          // Add new balances to collection
          if (result.balances?.length) {
            allBalances = [...allBalances, ...result.balances];
          }

          await this.dependencies.logger.debug("api", {
            message: "[XcpManagerDI] Pagination progress",
            currentCount: allBalances.length,
            expectedTotal,
            cursor,
            nextCursor: result.next_cursor,
            address
          });

          cursor = result.next_cursor || null;

          // Break if we have all expected results or more
          if (allBalances.length >= expectedTotal) {
            break;
          }

          if (!cursor) {
            break;
          }

        } while (cursor);

          // Return results if successful
          await this.dependencies.logger.info("api", {
            message: "[XcpManagerDI] Successfully fetched balances",
            finalCount: allBalances.length,
            expectedTotal,
            address
          });
          return { balances: allBalances, total: allBalances.length };
          
        } catch (attemptError) {
          lastError = attemptError instanceof Error ? attemptError : new Error(String(attemptError));
          await this.dependencies.logger.warn("api", {
            message: "[XcpManagerDI] Balance fetch attempt failed",
            attempt: attempt + 1,
            maxRetries: MAX_RETRIES,
            error: lastError.message,
            address
          });
          
          // If this is the last attempt, don't wait
          if (attempt < MAX_RETRIES - 1) {
            await new Promise(resolve => setTimeout(resolve, 1000 * (attempt + 1)));
          }
        }
      }

      throw new Error(`Failed to fetch complete balance set after ${MAX_RETRIES} attempts. Last error: ${lastError?.message}`);
    } catch (error) {
      await this.dependencies.logger.error("api", {
        message: "Error fetching all balances",
        address,
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      throw error;
    }
  }

  /**
   * Create dispense transaction
   */
  async createDispense(
    address: string,
    dispenser: string,
    quantity: number,
    options: {
      encoding?: string;
      fee_per_kb?: number;
      sat_per_vbyte?: number;
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
    
    // Handle options carefully to avoid deprecated fields and prioritize correct ones
    const finalApiOptions: Record<string, string | number | boolean> = {};

    // Prioritize sat_per_vbyte for fees
    if (options.sat_per_vbyte !== undefined) {
      finalApiOptions.sat_per_vbyte = options.sat_per_vbyte;
    } else if (options.fee_per_kb !== undefined) {
      if (options.fee_per_kb !== undefined && options.sat_per_vbyte === undefined) {
         finalApiOptions.fee_per_kb = options.fee_per_kb; // Send deprecated if new one not present
      }
    }

    // Copy other relevant options, EXCLUDING deprecated ones explicitly
    for (const [key, value] of Object.entries(options)) {
      if (value !== undefined && value !== null) {
        if (key === 'regular_dust_size') continue; // Skip deprecated
        if (key === 'fee_per_kb' && options.sat_per_vbyte !== undefined) continue; // Skip if sat_per_vbyte is used
        
        // If key is already set (like sat_per_vbyte from fee_per_kb), don't override from generic options spread
        if (!(key in finalApiOptions)) {
            finalApiOptions[key] = value.toString();
        }
      }
    }
    
    // Ensure return_psbt is explicitly set based on what the route wants (which is now false)
    if (options.return_psbt !== undefined) {
        finalApiOptions.return_psbt = options.return_psbt;
    } else {
        finalApiOptions.return_psbt = false; // Default if not specified by caller
    }

    // Append final processed options to queryParams
    for (const [key, value] of Object.entries(finalApiOptions)) {
        queryParams.append(key, String(value));
    }

    let lastError: string | null = null;

    for (const node of this.config.nodes) {
      const url = `${node.url}${endpoint}?${queryParams.toString()}`;
      
      await this.dependencies.logger.debug("api", {
        message: "Attempting dispense compose",
        node: node.name,
        url
      });

      try {
        const response = await this.dependencies.httpClient.get(url, {
          timeout: this.config.requestTimeout,
        });

        await this.dependencies.logger.debug("api", {
          message: "Dispense compose response",
          node: node.name,
          status: response.status,
          ok: response.ok
        });

        if (!response.ok) {
          const errorBody = response.data ? String(response.data) : `HTTP ${response.status}`;
          await this.dependencies.logger.error("api", {
            message: "Dispense compose error response",
            node: node.name,
            status: response.status,
            errorBody
          });
          try {
            const errorJson = typeof response.data === 'object' ? response.data : JSON.parse(String(response.data));
            if (errorJson.error) {
              lastError = errorJson.error;
            }
          } catch (_e) {
            lastError = errorBody;
          }
          continue; // Try the next node
        }

        await this.dependencies.logger.debug("api", {
          message: "Successful dispense compose response",
          node: node.name
        });
        return response.data;
      } catch (error) {
        await this.dependencies.logger.error("api", {
          message: "Dispense compose fetch error",
          node: node.name,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        lastError = error instanceof Error ? error.message : String(error);
      }
    }

    // Throw the last error message instead of generic message
    throw new Error(lastError || "All nodes failed to compose dispense transaction.");
  }

  /**
   * Create send transaction
   */
  async createSend(
    address: string,
    destination: string,
    asset: string,
    quantity: number,
    options: {
      memo?: string;
      memo_is_hex?: boolean;
      use_enhanced_send?: boolean;
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
      use_utxos_with_balances?: boolean;
      exclude_utxos_with_balances?: boolean;
      validate?: boolean;
      verbose?: boolean;
      show_unconfirmed?: boolean;
    } = {},
  ): Promise<any> {
    const endpoint = `/addresses/${address}/compose/send`;
    const queryParams = new URLSearchParams();

    queryParams.append("destination", destination);
    queryParams.append("asset", asset);
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

    for (const node of this.config.nodes) {
      const url = `${node.url}${endpoint}?${queryParams.toString()}`;
      
      await this.dependencies.logger.debug("api", {
        message: "Attempting send compose",
        node: node.name,
        url
      });

      try {
        const response = await this.dependencies.httpClient.get(url, {
          timeout: this.config.requestTimeout,
        });

        if (!response.ok) {
          const errorBody = response.data ? String(response.data) : `HTTP ${response.status}`;
          await this.dependencies.logger.error("api", {
            message: "Send compose error response",
            node: node.name,
            status: response.status,
            errorBody
          });
          try {
            const errorJson = typeof response.data === 'object' ? response.data : JSON.parse(String(response.data));
            if (errorJson.error) {
              lastError = errorJson.error;
            }
          } catch (_e) {
            lastError = errorBody;
          }
          continue; // Try the next node
        }

        await this.dependencies.logger.debug("api", {
          message: "Successful send compose response",
          node: node.name
        });
        return response.data;
      } catch (error) {
        await this.dependencies.logger.error("api", {
          message: "Send compose fetch error",
          node: node.name,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        lastError = error instanceof Error ? error.message : String(error);
      }
    }

    // Throw the last error message instead of generic message
    throw new Error(lastError || "All nodes failed to compose send transaction.");
  }

  /**
   * Compose attach transaction
   */
  async composeAttach(
    address: string,
    asset: string,
    quantity: number,
    options: ComposeAttachOptions = {}
  ): Promise<any> {
    const endpoint = `/addresses/${address}/compose/attach`;
    const queryParams = new URLSearchParams();

    queryParams.append("asset", asset);
    queryParams.append("quantity", quantity.toString());

    // Default verbose to true if not specified, useful for getting rawtx details
    if (options.verbose === undefined) {
      queryParams.append("verbose", "true");
    }

    // Default return_psbt to false if not specified by the caller for this new flow
    if (options.return_psbt === undefined) {
        queryParams.append("return_psbt", "false"); 
    } else {
        queryParams.append("return_psbt", options.return_psbt.toString());
    }

    // Handle fee_per_kb
    if (options.fee_per_kb) {
      queryParams.append("fee_per_kb", Math.floor(options.fee_per_kb).toString());
    }

    // Append all other provided options to query parameters
    for (const [key, value] of Object.entries(options)) {
      if (value !== undefined && value !== null) {
        // Avoid re-appending already handled options or ensure they are consistent
        if (key === 'asset' || key === 'quantity') continue;
        if (queryParams.has(key)) continue; // If already set by defaults/specific logic above
        queryParams.append(key, String(value));
      }
    }

    await this.dependencies.logger.debug("api", {
        message: "[XcpManagerDI.composeAttach] Calling Counterparty API",
        endpoint,
        queryParams: queryParams.toString()
    });

    // fetchXcpV2WithCache handles node iteration and error logging
    const response = await this.fetchXcpV2WithCache<any>(endpoint, queryParams);

    if (response.error || !response.result) {
        await this.dependencies.logger.error("api", {
            message: "[XcpManagerDI.composeAttach] Error from Counterparty API",
            error: response.error,
            result: response.result
        });
        throw new Error(response.error?.message || response.error?.description || response.error || "Failed to compose attach transaction with XCP.");
    }

    await this.dependencies.logger.debug("api", {
        message: "[XcpManagerDI.composeAttach] Response from Counterparty API",
        result: response.result
    });
    return response.result;
  }

  /**
   * Compose detach transaction
   */
  async composeDetach(
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
    queryParams.append("return_psbt", "false");
    queryParams.append("verbose", "true");

    // The API expects sat/kB
    if (options.fee_per_kb) {
      await this.dependencies.logger.debug("api", {
        message: "Setting fee rate",
        feePerKb: options.fee_per_kb
      });
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

    for (const node of this.config.nodes) {
      const url = `${node.url}${endpoint}?${queryParams.toString()}`;
      
      await this.dependencies.logger.debug("api", {
        message: "Attempting detach compose",
        node: node.name,
        url
      });

      try {
        const response = await this.dependencies.httpClient.get(url, {
          timeout: this.config.requestTimeout,
        });

        if (!response.ok) {
          const errorBody = response.data ? String(response.data) : `HTTP ${response.status}`;
          await this.dependencies.logger.error("api", {
            message: "Detach compose error response",
            node: node.name,
            status: response.status,
            errorBody
          });
          try {
            const errorJson = typeof response.data === 'object' ? response.data : JSON.parse(String(response.data));
            if (errorJson.error) {
              lastError = errorJson.error;
            }
          } catch (_e) {
            lastError = errorBody;
          }
          continue;
        }

        await this.dependencies.logger.debug("api", {
          message: "Successful detach compose response",
          node: node.name
        });
        return response.data;
      } catch (error) {
        await this.dependencies.logger.error("api", {
          message: "Detach compose fetch error",
          node: node.name,
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined
        });
        lastError = error instanceof Error ? error.message : String(error);
      }
    }

    throw new Error(lastError || "All nodes failed to compose detach transaction.");
  }

  /**
   * Check XCP API health
   */
  async checkHealth(cacheTimeout: number = 60): Promise<boolean> {
    const endpoint = "/healthz";
    const queryParams = new URLSearchParams();

    try {
      const response = await this.fetchXcpV2WithCache<{ result: { status: string } }>(
        endpoint,
        queryParams,
        cacheTimeout
      );

      return response?.result?.status === "Healthy";
    } catch (error) {
      await this.dependencies.logger.error("api", {
        message: "XCP health check failed",
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined
      });
      return false;
    }
  }

  /**
   * Get configuration information (safe for logging)
   */
  getConfig(): Omit<XcpManagerConfig, 'nodes'> & { nodeCount: number } {
    const { nodes, ...safeConfig } = this.config;
    return {
      ...safeConfig,
      nodeCount: nodes.length,
    };
  }

  /**
   * Get available node names
   */
  getNodeNames(): string[] {
    return this.config.nodes.map(node => node.name);
  }
}

// Provider interface for use in higher-level services
export interface XcpProvider {
  getXcpAsset(cpid: string): Promise<any>;
  getXcpBalancesByAddress(
    address: string,
    cpid?: string,
    utxoOnly?: boolean,
    options?: XcpBalanceOptions
  ): Promise<{ balances: XcpBalance[]; total: number; next_cursor?: string }>;
  getAllXcpBalancesByAddress(
    address: string,
    utxoOnly?: boolean
  ): Promise<{ balances: XcpBalance[]; total: number }>;
  createDispense(address: string, dispenser: string, quantity: number, options?: any): Promise<any>;
  createSend(address: string, destination: string, asset: string, quantity: number, options?: any): Promise<any>;
  composeAttach(address: string, asset: string, quantity: number, options?: ComposeAttachOptions): Promise<any>;
  composeDetach(utxo: string, destination: string, options?: ComposeDetachOptions): Promise<any>;
  checkHealth(cacheTimeout?: number): Promise<boolean>;
}

// Mock implementation for testing
export class MockXcpProvider implements XcpProvider {
  private mockResponses = new Map<string, any>();
  private shouldFail = false;
  private failureCount = 0;
  private maxFailures = 0;

  setMockResponse(method: string, params: any[], response: any): void {
    const key = `${method}:${JSON.stringify(params)}`;
    this.mockResponses.set(key, response);
  }

  setShouldFail(shouldFail: boolean, maxFailures = Infinity): void {
    this.shouldFail = shouldFail;
    this.failureCount = 0;
    this.maxFailures = maxFailures;
  }

  clearMockResponses(): void {
    this.mockResponses.clear();
  }

  async getXcpAsset(cpid: string): Promise<any> {
    await this.simulateDelay();
    if (this.shouldFailCheck()) {
      throw new Error(`Mock XCP provider configured to fail`);
    }
    
    // Check for custom mock response
    const mockKey = `getXcpAsset:${JSON.stringify([cpid])}`;
    if (this.mockResponses.has(mockKey)) {
      return this.mockResponses.get(mockKey);
    }
    
    return {
      result: {
        asset: cpid,
        mock: true,
        timestamp: Date.now(),
      }
    };
  }

  async getXcpBalancesByAddress(
    address: string,
    cpid?: string,
    utxoOnly?: boolean,
    options?: XcpBalanceOptions
  ): Promise<{ balances: XcpBalance[]; total: number; next_cursor?: string }> {
    await this.simulateDelay();
    if (this.shouldFailCheck()) {
      throw new Error(`Mock XCP provider configured to fail`);
    }

    const mockBalance: XcpBalance = {
      address,
      cpid: cpid || "MOCKASSET",
      quantity: 1000,
      utxo: utxoOnly ? "mock_utxo" : "",
      utxo_address: "",
      divisible: true,
    };

    return {
      balances: [mockBalance],
      total: 1,
      next_cursor: options?.cursor ? undefined : "mock_cursor"
    };
  }

  async getAllXcpBalancesByAddress(
    address: string,
    utxoOnly?: boolean
  ): Promise<{ balances: XcpBalance[]; total: number }> {
    const result = await this.getXcpBalancesByAddress(address, undefined, utxoOnly);
    return { balances: result.balances, total: result.total };
  }

  async createDispense(address: string, dispenser: string, quantity: number, _options?: any): Promise<any> {
    await this.simulateDelay();
    if (this.shouldFailCheck()) {
      throw new Error(`Mock XCP provider configured to fail`);
    }
    return {
      result: {
        rawtransaction: "mock_raw_tx",
        params: { address, dispenser, quantity },
        mock: true
      }
    };
  }

  async createSend(address: string, destination: string, asset: string, quantity: number, _options?: any): Promise<any> {
    await this.simulateDelay();
    if (this.shouldFailCheck()) {
      throw new Error(`Mock XCP provider configured to fail`);
    }
    return {
      result: {
        rawtransaction: "mock_send_tx",
        params: { address, destination, asset, quantity },
        mock: true
      }
    };
  }

  async composeAttach(address: string, asset: string, quantity: number, _options?: ComposeAttachOptions): Promise<any> {
    await this.simulateDelay();
    if (this.shouldFailCheck()) {
      throw new Error(`Mock XCP provider configured to fail`);
    }
    return {
      rawtransaction: "mock_attach_tx",
      params: { address, asset, quantity },
      mock: true
    };
  }

  async composeDetach(utxo: string, destination: string, _options?: ComposeDetachOptions): Promise<any> {
    await this.simulateDelay();
    if (this.shouldFailCheck()) {
      throw new Error(`Mock XCP provider configured to fail`);
    }
    return {
      rawtransaction: "mock_detach_tx",
      params: { utxo, destination },
      mock: true
    };
  }

  async checkHealth(_cacheTimeout?: number): Promise<boolean> {
    await this.simulateDelay();
    if (this.shouldFailCheck()) {
      return false;
    }
    return true;
  }

  private async simulateDelay(): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, 10));
  }

  private shouldFailCheck(): boolean {
    if (this.shouldFail && this.failureCount < this.maxFailures) {
      this.failureCount++;
      return true;
    }
    return false;
  }
}