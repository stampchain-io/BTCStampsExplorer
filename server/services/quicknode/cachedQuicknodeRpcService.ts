import { QuicknodeService } from "./quicknodeService.ts";
import { dbManager } from "$server/database/databaseManager.ts";

export class CachedQuicknodeRPCService {
  private static readonly CACHE_DURATION = 300;  // 5 minutes

  static async executeRPC<T>(
    name: string, 
    params: any,
    cacheDuration = this.CACHE_DURATION
  ) {
    const CACHE_KEY = `quicknode_rpc_${name}_${JSON.stringify(params)}`;

    try {
      const result = await dbManager.handleCache<T>(
        CACHE_KEY,
        async () => {
          const response = await QuicknodeService.fetchQuicknode(name, params);
          return response?.result;
        },
        cacheDuration,
      );

      return { result };
    } catch (error) {
      console.error(`Error executing RPC ${name}:`, error);
      return { error: `Failed to execute RPC ${name}` };
    }
  }
} 