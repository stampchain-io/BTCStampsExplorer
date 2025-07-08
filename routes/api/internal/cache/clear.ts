import { Handlers } from "$fresh/server.ts";
import { dbManager } from "$server/database/databaseManager.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";

export const handler: Handlers = {
  async POST(req: Request): Promise<Response> {
    try {
      const url = new URL(req.url);
      const pattern = url.searchParams.get("pattern") || "*";
      const clearAll = url.searchParams.get("all") === "true";

      if (clearAll) {
        // Clear all cache patterns
        const patterns = [
          "balance_*",
          "src20_balance_*",
          "src101_balance_*",
          "stamp_balance_*",
          "market_data_*",
          "src20_market_*",
          "transaction_*",
          "stamp_*",
          "block_*",
          "btc_price*",
          "fee_estimation_data",
        ];

        for (const p of patterns) {
          await dbManager.invalidateCacheByPattern(p);
        }

        console.log(`[CACHE CLEAR] All cache patterns cleared manually`);

        return ResponseUtil.success({
          message: "All caches cleared successfully",
          patterns: patterns,
          timestamp: new Date().toISOString(),
        });
      } else {
        // Clear specific pattern
        await dbManager.invalidateCacheByPattern(pattern);

        console.log(
          `[CACHE CLEAR] Cache pattern '${pattern}' cleared manually`,
        );

        return ResponseUtil.success({
          message: `Cache pattern '${pattern}' cleared successfully`,
          pattern: pattern,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error("Error clearing cache:", error);
      return ResponseUtil.internalError(
        error,
        "Failed to clear cache",
      );
    }
  },
};
