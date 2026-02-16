/**
 * Rate Limiting Middleware for stampchain.io
 *
 * Implements preventive rate limiting to protect against API abuse
 * Uses Redis for distributed rate limit tracking
 *
 * Created: November 14, 2025
 * Strategy: RATE_LIMITING_STRATEGY.md
 */

import { FreshContext } from "$fresh/server.ts";
import { getRedisConnection } from "$server/cache/redisClient.ts";
import { serverConfig } from "$server/config/config.ts";

interface RateLimitConfig {
  /** Time window in milliseconds */
  windowMs: number;
  /** Maximum requests allowed in window */
  max: number;
  /** Custom error message */
  message?: string;
  /** Block duration in seconds (0 = just deny request) */
  blockDuration?: number;
}

/**
 * Rate limit configurations by endpoint pattern
 * More specific patterns checked first
 *
 * Configuration based on research recommendations:
 * - SRC-20: 120 req/min (2/sec) - Known performance bottleneck
 * - Stamps: 180 req/min (3/sec) - Database-intensive queries
 * - Blocks: 240 req/min (4/sec) - Lighter queries
 * - General: 300 req/min (5/sec) - Standard API protection
 */
const rateLimitConfigs: Record<string, RateLimitConfig> = {
  // Tier 3: SRC-20 endpoints (strictest - known pain point)
  "/api/v2/src20": {
    windowMs: 60000, // 1 minute
    max: 120, // 120 requests = 2 req/sec (updated from 60)
    message: "SRC-20 API rate limit exceeded. Limit: 120 requests per minute.",
    blockDuration: 300, // 5 minute block (updated from 10 minutes)
  },

  // Tier 2: Expensive endpoints (database-intensive)
  "/api/v2/stamps": {
    windowMs: 60000,
    max: 180, // 180 requests = 3 req/sec (updated from 120)
    message: "Stamps API rate limit exceeded. Limit: 180 requests per minute.",
    blockDuration: 300, // 5 minute block
  },
  "/api/v2/blocks": {
    windowMs: 60000,
    max: 240, // 240 requests = 4 req/sec (updated from 120)
    message: "Blocks API rate limit exceeded. Limit: 240 requests per minute.",
    blockDuration: 180, // 3 minute block (updated from 5 minutes)
  },

  // Tier 1: General API protection (default for all other endpoints)
  "/api/v2": {
    windowMs: 60000,
    max: 300, // 300 requests = 5 req/sec
    message: "API rate limit exceeded. Limit: 300 requests per minute.",
    blockDuration: 60, // 1 minute block
  },
};

/**
 * Get client IP address from request headers
 * Cloudflare provides CF-Connecting-IP header with real client IP
 */
function getClientIp(req: Request): string {
  // Cloudflare header (most reliable)
  const cfIp = req.headers.get("CF-Connecting-IP");
  if (cfIp) return cfIp;

  // X-Forwarded-For fallback
  const xForwarded = req.headers.get("X-Forwarded-For");
  if (xForwarded) {
    // X-Forwarded-For can contain multiple IPs, take first
    return xForwarded.split(",")[0].trim();
  }

  // X-Real-IP fallback
  const xRealIp = req.headers.get("X-Real-IP");
  if (xRealIp) return xRealIp;

  return "unknown";
}

/**
 * Find the most specific rate limit config for a given path
 * Checks from most specific to least specific
 */
function getRateLimitConfig(pathname: string): RateLimitConfig | null {
  // Sort configs by specificity (longest path first)
  const sortedConfigs = Object.entries(rateLimitConfigs)
    .sort(([a], [b]) => b.length - a.length);

  // Find first matching config
  for (const [path, config] of sortedConfigs) {
    if (pathname.startsWith(path)) {
      return config;
    }
  }

  return null;
}

/**
 * Rate Limiting Middleware
 *
 * Flow:
 * 1. Skip internal APIs (protected by API key)
 * 2. Skip health checks (monitoring needs high frequency)
 * 3. Check for API key bypass
 * 4. Check if IP is blocked
 * 5. Increment request counter in Redis
 * 6. Return 429 if limit exceeded
 * 7. Add rate limit headers to response
 */
export async function rateLimitMiddleware(
  req: Request,
  ctx: FreshContext
): Promise<Response> {
  const url = new URL(req.url);
  const pathname = url.pathname;

  // Skip rate limiting for internal APIs (protected by API key)
  if (pathname.startsWith("/api/internal/")) {
    return ctx.next();
  }

  // Skip rate limiting for health checks
  if (pathname === "/api/health") {
    return ctx.next();
  }

  // Check for API key bypass
  const apiKey = req.headers.get("X-API-Key");
  const validApiKey = serverConfig.PUBLIC_API_KEY;

  if (apiKey && validApiKey && apiKey === validApiKey) {
    console.log("[RATE LIMITER] API key bypass granted");
    return ctx.next();
  }

  // Find matching config
  const config = getRateLimitConfig(pathname);

  if (!config) {
    // No rate limit configured for this endpoint
    return ctx.next();
  }

  // Get client IP
  const clientIp = getClientIp(req);

  // Redis keys
  const rateLimitKey = `ratelimit:${pathname}:${clientIp}`;
  const blockKey = `ratelimit:block:${pathname}:${clientIp}`;

  try {
    const redis = await getRedisConnection();

    // Check if IP is currently blocked
    const blocked = await redis.get(blockKey);
    if (blocked) {
      const ttl = await redis.pttl(blockKey);
      const retryAfter = Math.ceil(ttl / 1000);

      console.log(`[RATE LIMITER BLOCKED] IP ${clientIp} blocked for ${pathname} (${retryAfter}s remaining)`);

      return new Response(
        JSON.stringify({
          error: "Too many requests. You have been temporarily blocked.",
          retryAfter,
          limit: config.max,
          window: config.windowMs / 1000,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(config.max),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Date.now() + ttl),
          },
        }
      );
    }

    // Increment request counter
    const current = await redis.incr(rateLimitKey);

    // Set expiry on first request
    if (current === 1) {
      await redis.pexpire(rateLimitKey, config.windowMs);
    }

    // Check if limit exceeded
    if (current > config.max) {
      const ttl = await redis.pttl(rateLimitKey);
      const retryAfter = Math.ceil(ttl / 1000);

      console.warn(`[RATE LIMITER EXCEEDED] IP ${clientIp} exceeded limit for ${pathname}: ${current}/${config.max}`);

      // Block IP if blockDuration configured
      if (config.blockDuration && config.blockDuration > 0) {
        await redis.setex(blockKey, config.blockDuration, "1");
        console.warn(`[RATE LIMITER BLOCK] IP ${clientIp} blocked for ${config.blockDuration}s`);
      }

      return new Response(
        JSON.stringify({
          error: config.message || "Rate limit exceeded",
          retryAfter,
          limit: config.max,
          window: config.windowMs / 1000,
          blocked: config.blockDuration ? true : false,
          blockDuration: config.blockDuration || 0,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(config.max),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Date.now() + ttl),
          },
        }
      );
    }

    // Calculate remaining requests
    const remaining = config.max - current;

    // Log rate limit status (debug mode)
    const rateLimitDebug = serverConfig.RATE_LIMIT_DEBUG;
    if (rateLimitDebug) {
      console.log(`[RATE LIMITER] IP ${clientIp} ${pathname}: ${current}/${config.max} (${remaining} remaining)`);
    }

    // Continue to next middleware/handler
    const response = await ctx.next();

    // Add rate limit headers to response
    response.headers.set("X-RateLimit-Limit", String(config.max));
    response.headers.set("X-RateLimit-Remaining", String(remaining));
    response.headers.set("X-RateLimit-Reset", String(Date.now() + config.windowMs));

    return response;
  } catch (error) {
    console.error("[RATE LIMITER ERROR]", error);

    // Fail open - allow request if Redis fails
    // Better to have no rate limiting than block all requests
    return ctx.next();
  }
}

/**
 * Utility function to clear rate limit for specific IP (admin use)
 */
export async function clearRateLimit(ip: string, path?: string): Promise<void> {
  try {
    const redis = await getRedisConnection();

    if (path) {
      // Clear specific endpoint
      await redis.del(`ratelimit:${path}:${ip}`);
      await redis.del(`ratelimit:block:${path}:${ip}`);
    } else {
      // Clear all rate limits for IP (use pattern matching)
      const keys = await redis.keys(`ratelimit:*:${ip}`);
      if (keys.length > 0) {
        await redis.del(...keys);
      }
      const blockKeys = await redis.keys(`ratelimit:block:*:${ip}`);
      if (blockKeys.length > 0) {
        await redis.del(...blockKeys);
      }
    }

    console.log(`[RATE LIMITER] Cleared rate limits for IP ${ip}${path ? ` on ${path}` : ""}`);
  } catch (error) {
    console.error("[RATE LIMITER] Error clearing rate limit:", error);
    throw error;
  }
}
