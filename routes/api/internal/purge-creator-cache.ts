import { FreshContext } from "$fresh/server.ts";
import { dbManager } from "$server/database/databaseManager.ts";
import { WebResponseUtil } from "$lib/utils/api/responses/webResponseUtil.ts";
import { logger } from "$lib/utils/logger.ts";
import { InternalRouteGuard } from "$server/services/security/internalRouteGuard.ts";
import { StampRepository } from "$server/database/stampRepository.ts";

export async function handler(
  req: Request,
  _ctx: FreshContext,
): Promise<Response> {
  try {
    // Security check for internal endpoints
    const accessError = InternalRouteGuard.requireAPIKey(req);
    if (accessError) {
      logger.warn("cache", {
        message: "Access denied for creator cache purge",
        origin: new URL(req.url).origin,
      });
      return accessError;
    }

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

    if (address) {
      // Deterministic direct-key invalidation for this specific address —
      // recomputes the same cache-key hash the read used, so it reliably
      // clears the entry regardless of which ECS task originally cached it.
      await StampRepository.invalidateCreatorNameCache(address);
    }

    // Also clear whatever this process's local category registry knows
    // about. Note: this only catches keys registered on *this* process —
    // it's a best-effort supplement, not a substitute for the direct-key
    // invalidation above when a specific address is provided.
    await dbManager.invalidateCacheByCategory("creator");

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
