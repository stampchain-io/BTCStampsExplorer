import { ApiResponseUtil } from "$lib/utils/api/responses/apiResponseUtil.ts";
import { logger } from "$lib/utils/logger.ts";

/**
 * Security guard for internal API endpoints that need to be accessible from our frontend
 * but not from external sources.
 */
export class InternalApiFrontendGuard {
  /**
   * Check if the request is from our own frontend application
   * This allows browser requests from our domain while blocking external access
   */
  static requireInternalAccess(req: Request) {
    // Skip in development
    if (Deno.env.get("DENO_ENV") === "development") {
      return null;
    }

    const url = new URL(req.url);
    const origin = req.headers.get("Origin");
    const referer = req.headers.get("Referer");
    const host = req.headers.get("Host");
    
    // Check for API key first (for server-to-server calls)
    const apiKey = req.headers.get("X-API-Key");
    const expectedApiKey = Deno.env.get("INTERNAL_API_KEY");
    
    if (apiKey && expectedApiKey && apiKey === expectedApiKey) {
      return null; // Valid API key
    }

    // For browser requests, check origin/referer
    const allowedDomains = [
      "stampchain.io",
      "www.stampchain.io",
      "http://stampchain.io",      // Allow HTTP (load balancer may terminate HTTPS)
      "http://www.stampchain.io",  // Allow HTTP (load balancer may terminate HTTPS)
      "https://stampchain.io",
      "https://www.stampchain.io"
    ];

    // Check if request is from our domain
    const isFromOurDomain = (domain: string | null): boolean => {
      if (!domain) return false;
      
      try {
        // Handle both full URLs and domain-only strings
        const checkDomain = domain.startsWith("http") 
          ? new URL(domain).hostname 
          : domain;
          
        return allowedDomains.some(allowed => {
          const allowedHost = allowed.replace(/^https?:\/\//, "");
          return checkDomain === allowedHost || checkDomain.endsWith(`.${allowedHost}`);
        });
      } catch {
        return false;
      }
    };

    // Check origin first (most reliable for CORS requests)
    if (origin && isFromOurDomain(origin)) {
      return null;
    }

    // Check referer as fallback
    if (referer && isFromOurDomain(referer)) {
      return null;
    }

    // Check host header (for same-origin requests that might not have origin/referer)
    if (host && isFromOurDomain(host)) {
      // Additional check: ensure it's actually a browser request
      const userAgent = req.headers.get("User-Agent") || "";
      const acceptHeader = req.headers.get("Accept") || "";
      
      // Basic browser detection
      const isBrowserRequest = 
        (userAgent.includes("Mozilla") || userAgent.includes("Chrome") || userAgent.includes("Safari")) &&
        (acceptHeader.includes("text/html") || acceptHeader.includes("application/json") || acceptHeader.includes("*/*"));
      
      if (isBrowserRequest) {
        return null;
      }
    }

    // CloudFlare handling - check CF headers
    const cfConnectingIp = req.headers.get("CF-Connecting-IP");
    const cfRay = req.headers.get("CF-Ray");
    
    if (cfConnectingIp && cfRay) {
      // Request is coming through CloudFlare
      // Check CloudFlare's forwarded headers
      const xForwardedHost = req.headers.get("X-Forwarded-Host");
      
      if (xForwardedHost && isFromOurDomain(xForwardedHost)) {
        return null;
      }
    }

    // Log rejection for debugging
    logger.warn("security", {
      message: "Internal API access denied",
      origin,
      referer,
      host,
      path: url.pathname,
      hasApiKey: !!apiKey,
      cfHeaders: {
        cfRay,
        cfConnectingIp,
        xForwardedHost: req.headers.get("X-Forwarded-Host")
      }
    });

    return ApiResponseUtil.forbidden("Access denied");
  }
}