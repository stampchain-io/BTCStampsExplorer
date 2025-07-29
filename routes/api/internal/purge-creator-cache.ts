import { FreshContext } from "$fresh/server.ts";
import { dbManager } from "$server/database/databaseManager.ts";
import { WebResponseUtil } from "$lib/utils/api/responses/webResponseUtil.ts";
import { logger } from "$lib/utils/monitoring/logging/logger.ts";

export async function handler(
  req: Request,
  _ctx: FreshContext,
): Promise<Response> {
  try {
    // This is an internal endpoint, so we should verify authorization
    // For now, we'll allow it for debugging purposes, but in production
    // this should be protected with authentication

    const url = new URL(req.url);
    const address = url.searchParams.get("address");

    // Log the purge request
    logger.info(
      "cache",
      {
        message: `[CACHE PURGE] Purging creator cache${
          address ? ` for address: ${address}` : " for all addresses"
        }`,
      },
    );

    // Invalidate all creator cache entries
    await dbManager.invalidateCacheByCategory("creator");

    // Also try pattern-based invalidation for backwards compatibility
    await dbManager.invalidateCacheByPattern("creator_*");

    const message = address
      ? `Creator cache purged for address: ${address}`
      : "All creator cache entries purged successfully";

    console.log(`[CACHE PURGE] ${message}`);

    return WebResponseUtil.jsonResponse({
      success: true,
      message,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[CACHE PURGE ERROR]", error);
    return WebResponseUtil.internalError(
      error,
      "Failed to purge creator cache",
    );
  }
}
