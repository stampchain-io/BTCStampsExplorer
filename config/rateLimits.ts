/**
 * Rate Limiting Configuration
 *
 * Centralized rate limit settings for stampchain.io API
 *
 * Created: November 2025
 */

export interface RateLimitTier {
  name: string;
  requestsPerMinute: number;
  requestsPerSecond: number;
  blockDurationSeconds: number;
  endpoints: string[];
}

export const RATE_LIMIT_TIERS: Record<string, RateLimitTier> = {
  TIER_3_SRC20: {
    name: "SRC-20 Endpoints",
    requestsPerMinute: 120,
    requestsPerSecond: 2,
    blockDurationSeconds: 300,
    endpoints: ["/api/v2/src20"],
  },
  TIER_2_STAMPS: {
    name: "Stamps Endpoints",
    requestsPerMinute: 180,
    requestsPerSecond: 3,
    blockDurationSeconds: 300,
    endpoints: ["/api/v2/stamps"],
  },
  TIER_2_BLOCKS: {
    name: "Blocks Endpoints",
    requestsPerMinute: 240,
    requestsPerSecond: 4,
    blockDurationSeconds: 180,
    endpoints: ["/api/v2/blocks"],
  },
  TIER_1_GENERAL: {
    name: "General API",
    requestsPerMinute: 300,
    requestsPerSecond: 5,
    blockDurationSeconds: 60,
    endpoints: ["/api/v2"],
  },
};

export const RATE_LIMIT_EXEMPTIONS = {
  HEALTH_CHECK: "/api/health",
  INTERNAL_API_PREFIX: "/api/internal/",
};
