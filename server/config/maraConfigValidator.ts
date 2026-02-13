/**
 * MARA Configuration Validator
 *
 * This module provides validation logic for MARA configuration on server startup
 * to ensure all settings are valid before the application starts.
 */

import { logger } from "$lib/utils/logger.ts";
import {
    type MaraConfig,
    createMaraConfigFromEnv,
    DEFAULT_MARA_CONFIG
} from "$server/config/maraConfig.ts";
import { serverConfig } from "$server/config/config.ts";

/**
 * Result of MARA configuration validation
 */
export interface MaraConfigValidationResult {
  /**
   * Whether the configuration is valid
   */
  isValid: boolean;

  /**
   * The validated configuration (if valid) or default config (if disabled)
   */
  config: MaraConfig | null;

  /**
   * Array of validation errors (if any)
   */
  errors: string[];

  /**
   * Array of validation warnings (non-fatal issues)
   */
  warnings: string[];
}

/**
 * Validates MARA configuration on server startup
 * @returns Validation result with config, errors, and warnings
 */
export function validateMaraConfigOnStartup(): MaraConfigValidationResult {
  const result: MaraConfigValidationResult = {
    isValid: true,
    config: null,
    errors: [],
    warnings: [],
  };

  // MARA is always available - activation depends on user providing outputValue

  logger.info("config", {
    message: "Validating MARA configuration",
  });

  try {
    // Create and validate configuration
    const config = createMaraConfigFromEnv();

    if (!config) {
      result.errors.push("Failed to create MARA configuration from environment");
      result.isValid = false;
      return result;
    }

    // Additional validation checks

    // 1. Validate API URL is reachable (warning only, don't fail startup)
    try {
      const url = new URL(config.apiBaseUrl);
      if (!url.protocol.startsWith('https')) {
        result.warnings.push(`MARA API URL is not using HTTPS: ${config.apiBaseUrl}`);
      }
    } catch (_error) {
      result.errors.push(`Invalid MARA API URL format: ${config.apiBaseUrl}`);
      result.isValid = false;
    }

    // 2. Validate timeout is reasonable
    if (config.apiTimeout < 5000) {
      result.warnings.push(`MARA API timeout may be too low: ${config.apiTimeout}ms`);
    } else if (config.apiTimeout > 60000) {
      result.warnings.push(`MARA API timeout may be too high: ${config.apiTimeout}ms`);
    }

    // 3. Validate service fee amount is exactly 42000
    if (config.serviceFeeAmount !== 42000) {
      result.errors.push(
        `MARA service fee must be exactly 42000 sats, got: ${config.serviceFeeAmount}`
      );
      result.isValid = false;
    }

    // 4. Check for development/production consistency
    const isProduction = serverConfig.IS_PRODUCTION;
    const isDefaultAddress = config.serviceFeeAddress === DEFAULT_MARA_CONFIG.serviceFeeAddress;

    if (!isProduction && !isDefaultAddress) {
      result.warnings.push(
        "Using non-default MARA service fee address in non-production environment"
      );
    }

    // 5. Log configuration summary
    logger.info("config", {
      message: "MARA configuration validated",
      apiBaseUrl: config.apiBaseUrl,
      apiTimeout: config.apiTimeout,
      serviceFeeAmount: config.serviceFeeAmount,
      serviceFeeAddress: config.serviceFeeAddress,
      enabled: config.enabled,
      environment: serverConfig.DENO_ENV,
    });

    result.config = config;

  } catch (error) {
    result.isValid = false;
    result.errors.push(
      error instanceof Error ? error.message : "Unknown configuration error"
    );

    logger.error("config", {
      message: "MARA configuration validation failed",
      error: error instanceof Error ? error.message : String(error),
      stack: error instanceof Error ? error.stack : undefined,
    });
  }

  // Log summary of validation results
  if (result.errors.length > 0) {
    logger.error("config", {
      message: "MARA configuration has errors",
      errors: result.errors,
    });
  }

  if (result.warnings.length > 0) {
    logger.warn("config", {
      message: "MARA configuration has warnings",
      warnings: result.warnings,
    });
  }

  return result;
}

/**
 * Validates MARA configuration and throws on error
 * Use this for critical paths where invalid config should halt execution
 *
 * @throws Error if configuration is invalid
 */
export function assertValidMaraConfig(): MaraConfig {
  const validation = validateMaraConfigOnStartup();

  if (!validation.isValid || !validation.config) {
    const errorMessage = validation.errors.length > 0
      ? `MARA configuration errors: ${validation.errors.join(', ')}`
      : "MARA configuration validation failed";
    throw new Error(errorMessage);
  }

  return validation.config;
}

/**
 * Checks if MARA integration is properly configured and enabled
 * @returns true if MARA is enabled and configured correctly
 */
export function isMaraIntegrationEnabled(): boolean {
  const validation = validateMaraConfigOnStartup();
  return validation.isValid && validation.config !== null && validation.config.enabled;
}

/**
 * Gets the current MARA configuration if valid
 * @returns MARA configuration or null if disabled/invalid
 */
export function getValidatedMaraConfig(): MaraConfig | null {
  const validation = validateMaraConfigOnStartup();
  return validation.isValid ? validation.config : null;
}
