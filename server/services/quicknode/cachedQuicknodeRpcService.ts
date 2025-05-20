import { Buffer } from "node:buffer";
import { QuicknodeService } from "./quicknodeService.ts";
import { dbManager } from "$server/database/databaseManager.ts";

export class CachedQuicknodeRPCService {
  private static readonly CACHE_DURATION = 300;  // 5 minutes

  static async executeRPC<T>(
    name: string, 
    params: any[],
    cacheDuration = this.CACHE_DURATION
  ): Promise<{ result?: T; error?: string }> {
    const stringifiedParams = JSON.stringify(params.map(p => p instanceof Buffer ? p.toString('hex') : p));
    const CACHE_KEY = `quicknode_rpc_${name}_${stringifiedParams}`;

    try {
      let isCacheHit = true;
      const result = await dbManager.handleCache<T | undefined>(
        CACHE_KEY,
        async () => {
          isCacheHit = false;
          const response = await QuicknodeService.fetchQuicknode(name, params);
          if (response && response.result) {
            return response.result;
          } else if (response && response.error) {
            console.warn(`[CACHE] Quicknode call resulted in error (not caching): ${name}, ${JSON.stringify(response.error)}`);
            throw new Error(typeof response.error === 'string' ? response.error : JSON.stringify(response.error));
          }
          return undefined;
        },
        cacheDuration,
      );

      if (isCacheHit && result !== undefined) {
        // console.log(`[CACHE] Cache HIT for: ${CACHE_KEY}, dataRetrieved: ${!!result}`); // Example of a removed log
      }

      if (result === undefined && !isCacheHit) {
        console.error(`[CACHE] Cache miss BUT fetch did not return data for: ${CACHE_KEY}`);
        return { error: `Failed to fetch data for RPC ${name} after cache miss` };
      }
      
      return { result: result as T };

    } catch (error) {
      console.error(`[CACHE] Error executing RPC via cache service for ${name}, CACHE_KEY: ${CACHE_KEY}`, error);
      return { error: `Failed to execute RPC ${name}: ${error instanceof Error ? error.message : String(error)}` };
    }
  }
} 