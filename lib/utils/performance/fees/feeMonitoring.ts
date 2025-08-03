/**
 * Fee monitoring utilities for tracking provider performance
 * TODO: Implement proper monitoring metrics
 */

import { logger } from "$lib/utils/logger.ts";
import { LOG_NAMESPACES } from "$lib/constants/loggingConstants.ts";

/**
 * Record successful fee fetch
 */
export function recordFeeSuccess(provider: string, responseTime: number): void {
  logger.debug(LOG_NAMESPACES.FEE_MONITORING, {
    message: "Fee fetch successful",
    provider,
    responseTime,
  });
}

/**
 * Record failed fee fetch
 */
export function recordFeeFailure(provider: string, error: string, responseTime: number): void {
  logger.warn(LOG_NAMESPACES.FEE_MONITORING, {
    message: "Fee fetch failed",
    provider,
    error,
    responseTime,
  });
}

/**
 * Record fallback usage
 */
export function recordFallbackUsage(
  fallbackType: string,
  reason: string,
  details?: string
): void {
  logger.info(LOG_NAMESPACES.FEE_MONITORING, {
    message: "Fee fallback used",
    fallbackType,
    reason,
    details,
  });
}