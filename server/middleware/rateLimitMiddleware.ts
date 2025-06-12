import { RATE_LIMIT_REQUESTS, RATE_LIMIT_WINDOW } from "$lib/utils/constants.ts";
import { ApiResponseUtil } from "$lib/utils/apiResponseUtil.ts";
import { logger } from "$lib/utils/logger.ts";

interface RateLimitEntry {
  count: number;
  resetTime: number;
  firstRequest: number;
}

// In-memory rate limit store (could be moved to Redis for distributed systems)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetTime) {
      rateLimitStore.delete(key);
    }
  }
}, 5 * 60 * 1000);

export class RateLimitMiddleware {
  /**
   * Check rate limit for a request
   * @param req - The incoming request
   * @param limit - Maximum number of requests (default from constants)
   * @param window - Time window in milliseconds (default from constants)
   * @returns Response if rate limited, null if allowed
   */
  static async checkRateLimit(
    req: Request,
    limit: number = RATE_LIMIT_REQUESTS,
    window: number = RATE_LIMIT_WINDOW,
  ): Promise<Response | null> {
    // Get client identifier (IP address with fallbacks)
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                     req.headers.get("x-real-ip") ||
                     req.headers.get("cf-connecting-ip") ||
                     "unknown";
    
    const now = Date.now();
    const key = `rate_limit_fees_${clientIP}`;
    
    logger.debug("stamps", {
      message: "Rate limit check",
      clientIP,
      key: key.substring(0, 20) + "...",
      limit,
      window,
    });

    const entry = rateLimitStore.get(key);
    
    if (!entry || now > entry.resetTime) {
      // Reset or create new entry
      rateLimitStore.set(key, {
        count: 1,
        resetTime: now + window,
        firstRequest: now,
      });
      
      logger.debug("stamps", {
        message: "Rate limit entry created/reset",
        clientIP,
        resetTime: now + window,
      });
      
      return null; // No rate limit
    }
    
    if (entry.count >= limit) {
      const remainingTime = Math.ceil((entry.resetTime - now) / 1000);
      
      logger.warn("stamps", {
        message: "Rate limit exceeded",
        clientIP,
        count: entry.count,
        limit,
        remainingTime,
        windowDuration: window / 1000,
      });
      
      return ApiResponseUtil.tooManyRequests(
        `Rate limit exceeded. Maximum ${limit} requests per ${window / 1000} seconds. Try again in ${remainingTime} seconds.`,
        {
          limit,
          remaining: 0,
          resetTime: entry.resetTime,
          retryAfter: remainingTime,
        },
      );
    }
    
    // Increment counter
    entry.count++;
    const remaining = limit - entry.count;
    
    logger.debug("stamps", {
      message: "Rate limit check passed",
      clientIP,
      count: entry.count,
      remaining,
      resetTime: entry.resetTime,
    });
    
    return null; // No rate limit
  }

  /**
   * Get rate limit headers for a response
   * @param req - The incoming request
   * @param limit - Maximum number of requests
   * @param window - Time window in milliseconds
   * @returns Headers object with rate limit information
   */
  static getRateLimitHeaders(
    req: Request,
    limit: number = RATE_LIMIT_REQUESTS,
    window: number = RATE_LIMIT_WINDOW,
  ): Record<string, string> {
    const clientIP = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
                     req.headers.get("x-real-ip") ||
                     req.headers.get("cf-connecting-ip") ||
                     "unknown";
    
    const key = `rate_limit_fees_${clientIP}`;
    const entry = rateLimitStore.get(key);
    const now = Date.now();
    
    if (!entry || now > entry.resetTime) {
      return {
        "X-RateLimit-Limit": limit.toString(),
        "X-RateLimit-Remaining": (limit - 1).toString(),
        "X-RateLimit-Reset": Math.ceil((now + window) / 1000).toString(),
        "X-RateLimit-Window": (window / 1000).toString(),
      };
    }
    
    const remaining = Math.max(0, limit - entry.count);
    
    return {
      "X-RateLimit-Limit": limit.toString(),
      "X-RateLimit-Remaining": remaining.toString(),
      "X-RateLimit-Reset": Math.ceil(entry.resetTime / 1000).toString(),
      "X-RateLimit-Window": (window / 1000).toString(),
    };
  }

  /**
   * Enhanced rate limiting for fee endpoints with specific limits
   * @param req - The incoming request
   * @returns Response if rate limited, null if allowed
   */
  static async checkFeeRateLimit(req: Request): Promise<Response | null> {
    // More restrictive limits for fee endpoints (60 requests per minute)
    const FEE_RATE_LIMIT = 60;
    const FEE_RATE_WINDOW = 60 * 1000; // 1 minute
    
    return this.checkRateLimit(req, FEE_RATE_LIMIT, FEE_RATE_WINDOW);
  }
} 