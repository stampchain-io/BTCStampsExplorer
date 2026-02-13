import { ApiResponseUtil } from "$lib/utils/api/responses/apiResponseUtil.ts";
import { serverConfig } from "$server/config/config.ts";

/**
 * CloudFlare-aware security guard for internal endpoints
 * This provides a quick security layer while CloudFlare is in use
 */
export class CloudflareInternalGuard {
  /**
   * Simple security check that works with CloudFlare
   * Uses a shared secret header that CloudFlare can be configured to add
   */
  static requireInternalAccess(req: Request) {
    // Skip in development
    if (serverConfig.IS_DEVELOPMENT) {
      return null;
    }

    // Method 1: Check for internal secret header (configure CloudFlare to add this)
    const internalSecret = req.headers.get("X-Internal-Secret");
    const expectedSecret = serverConfig.INTERNAL_API_SECRET;

    if (expectedSecret && internalSecret === expectedSecret) {
      return null; // Access granted
    }

    // Method 2: Check CloudFlare Access Service Token (if using CloudFlare Access)
    const cfAccessToken = req.headers.get("CF-Access-Client-Id");
    const cfAccessSecret = req.headers.get("CF-Access-Client-Secret");
    const expectedCfId = serverConfig.CF_ACCESS_CLIENT_ID;
    const expectedCfSecret = serverConfig.CF_ACCESS_CLIENT_SECRET;
    
    if (expectedCfId && expectedCfSecret && 
        cfAccessToken === expectedCfId && 
        cfAccessSecret === expectedCfSecret) {
      return null; // Access granted via CloudFlare Access
    }

    // Method 3: Check if request is from internal network (CloudFlare Worker or internal service)
    const cfConnectingIp = req.headers.get("CF-Connecting-IP");
    const cfWorkerHeader = req.headers.get("CF-Worker");
    
    // If it's from a CloudFlare Worker (internal request)
    if (cfWorkerHeader === "true") {
      return null; // Trust CloudFlare Workers
    }

    // Method 4: Simple API key check as fallback
    const apiKey = req.headers.get("X-API-Key");
    const expectedApiKey = serverConfig.INTERNAL_API_KEY;
    
    if (expectedApiKey && apiKey === expectedApiKey) {
      return null; // Access granted
    }

    // Log the rejection for debugging
    console.warn("[INTERNAL GUARD] Access denied", {
      hasInternalSecret: !!internalSecret,
      hasCfAccess: !!cfAccessToken,
      hasCfWorker: !!cfWorkerHeader,
      hasApiKey: !!apiKey,
      cfConnectingIp,
      origin: req.headers.get("Origin"),
      referer: req.headers.get("Referer"),
    });

    return ApiResponseUtil.forbidden("Access denied");
  }
}