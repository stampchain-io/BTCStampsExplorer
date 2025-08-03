/**
 * MARA Feature Flag Utilities
 * 
 * Provides runtime control and checking for MARA integration feature flag
 */

import { logger } from "$lib/utils/logger.ts";
import { isMaraIntegrationEnabled, getValidatedMaraConfig } from "$/server/config/maraConfigValidator.ts";

/**
 * Check if MARA integration is currently enabled
 * This is the primary function to use throughout the application
 * 
 * @returns true if MARA is enabled and properly configured
 */
export function isMaraEnabled(): boolean {
  return isMaraIntegrationEnabled();
}

/**
 * Get MARA configuration if enabled
 * @returns MARA configuration or null if disabled
 */
export function getMaraConfigIfEnabled() {
  return getValidatedMaraConfig();
}

/**
 * Check if MARA API is available for use
 * This checks both the feature flag and service health
 * 
 * @returns true if MARA API can be used
 */
export async function isMaraApiAvailable(): Promise<boolean> {
  if (!isMaraEnabled()) {
    return false;
  }

  try {
    // Dynamically import to avoid loading MARA service if disabled
    const { MaraSlipstreamService } = await import("$/server/services/mara/maraSlipstreamService.ts");
    return MaraSlipstreamService.isAvailable();
  } catch (error) {
    logger.error("mara", {
      message: "Failed to check MARA API availability",
      error: error instanceof Error ? error.message : String(error),
    });
    return false;
  }
}

/**
 * Execute a function only if MARA is enabled
 * Provides a clean way to conditionally execute MARA-specific code
 * 
 * @param fn Function to execute if MARA is enabled
 * @param fallback Optional fallback function if MARA is disabled
 * @returns Result of the executed function or fallback
 */
export async function withMaraEnabled<T>(
  fn: () => T | Promise<T>,
  fallback?: () => T | Promise<T>
): Promise<T | undefined> {
  if (isMaraEnabled()) {
    try {
      return await fn();
    } catch (error) {
      logger.error("mara", {
        message: "Error executing MARA-enabled function",
        error: error instanceof Error ? error.message : String(error),
      });
      if (fallback) {
        return await fallback();
      }
      throw error;
    }
  } else if (fallback) {
    return await fallback();
  }
  return undefined;
}

/**
 * Log MARA feature flag status
 * Useful for debugging and startup diagnostics
 */
export function logMaraFeatureStatus(): void {
  const enabled = isMaraEnabled();
  const config = getMaraConfigIfEnabled();
  
  logger.info("mara", {
    message: "MARA feature flag status",
    enabled,
    hasValidConfig: config !== null,
    environment: Deno.env.get("DENO_ENV") || "development",
  });

  if (enabled && config) {
    logger.info("mara", {
      message: "MARA configuration loaded",
      apiBaseUrl: config.apiBaseUrl,
      serviceFeeAmount: config.serviceFeeAmount,
    });
  }
}

/**
 * Check if request should use MARA mode based on parameters
 * @param outputValue The output value from the request
 * @returns true if MARA mode should be activated
 */
export function shouldUseMaraMode(outputValue?: number): boolean {
  if (!isMaraEnabled()) {
    return false;
  }

  // MARA mode is activated when outputValue is between 1 and 332
  return outputValue !== undefined && outputValue >= 1 && outputValue <= 332;
}

/**
 * Get MARA service fee configuration
 * @returns Service fee amount and address if MARA is enabled, null otherwise
 */
export function getMaraServiceFeeConfig(): { amount: number; address: string } | null {
  const config = getMaraConfigIfEnabled();
  if (!config) {
    return null;
  }

  return {
    amount: config.serviceFeeAmount,
    address: config.serviceFeeAddress,
  };
}

/**
 * Development utility to temporarily enable/disable MARA
 * WARNING: This is for development/testing only and should not be used in production
 * 
 * @param enabled Whether to enable or disable MARA
 */
export function setMaraEnabledForTesting(enabled: boolean): void {
  if (Deno.env.get("DENO_ENV") === "production") {
    throw new Error("Cannot modify MARA feature flag in production");
  }

  const currentValue = Deno.env.get("ENABLE_MARA_INTEGRATION");
  const newValue = enabled ? "1" : "0";
  
  logger.warn("mara", {
    message: "Modifying MARA feature flag for testing",
    previousValue: currentValue,
    newValue,
  });

  Deno.env.set("ENABLE_MARA_INTEGRATION", newValue);
}