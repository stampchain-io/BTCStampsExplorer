/**
 * MARA Slipstream Integration Configuration
 *
 * This module defines the configuration types and interfaces for the MARA integration,
 * including API endpoints, service fees, and feature flags.
 */

// Import DEFAULT_MARA_CONFIG for use within this file
import { DEFAULT_MARA_CONFIG } from "$constants";

/**
 * MARA configuration interface with strongly typed properties
 * All properties are required for proper MARA integration operation
 */
export interface MaraConfig {
  /**
   * Base URL for MARA Slipstream API
   * @example "https://slipstream.mara.com/rest-api"
   */
  readonly apiBaseUrl: string;

  /**
   * API request timeout in milliseconds
   * @minimum 1000
   * @maximum 60000
   * @default 30000
   */
  readonly apiTimeout: number;

  /**
   * Service fee amount in satoshis for MARA transactions
   * Must be exactly 42000 sats as required by MARA
   * @constant 42000
   */
  readonly serviceFeeAmount: number;

  /**
   * Bitcoin address for MARA service fee collection
   * Must be a valid Bitcoin address (bech32 format preferred)
   * @example "bc1qhhv6rmxvq5mj2fc3zne2gpjqduy45urapje64m"
   */
  readonly serviceFeeAddress: string;

  /**
   * Feature flag to enable/disable MARA integration
   * When false, all MARA functionality is bypassed
   */
  readonly enabled: boolean;
}

/**
 * Type guard to check if a value is a valid MaraConfig
 * @param config - The value to check
 * @returns True if the value is a valid MaraConfig
 */
export function isMaraConfig(config: unknown): config is MaraConfig {
  if (!config || typeof config !== 'object') {
    return false;
  }

  const obj = config as Record<string, unknown>;

  return (
    typeof obj.apiBaseUrl === 'string' &&
    obj.apiBaseUrl.length > 0 &&
    typeof obj.apiTimeout === 'number' &&
    obj.apiTimeout >= 1000 &&
    obj.apiTimeout <= 60000 &&
    typeof obj.serviceFeeAmount === 'number' &&
    obj.serviceFeeAmount === 42000 &&
    typeof obj.serviceFeeAddress === 'string' &&
    obj.serviceFeeAddress.length > 0 &&
    typeof obj.enabled === 'boolean'
  );
}

/**
 * Bitcoin address validation regex patterns
 */
const BITCOIN_ADDRESS_PATTERNS = {
  // Bech32 addresses (bc1...)
  bech32: /^bc1[a-z0-9]{39,59}$/,
  // P2PKH addresses (1...)
  p2pkh: /^1[a-zA-HJ-NP-Z1-9]{25,34}$/,
  // P2SH addresses (3...)
  p2sh: /^3[a-zA-HJ-NP-Z1-9]{25,34}$/,
};

/**
 * Validates a Bitcoin address format
 * @param address - The address to validate
 * @returns True if the address is valid
 */
export function isValidBitcoinAddress(address: string): boolean {
  return (
    BITCOIN_ADDRESS_PATTERNS.bech32.test(address) ||
    BITCOIN_ADDRESS_PATTERNS.p2pkh.test(address) ||
    BITCOIN_ADDRESS_PATTERNS.p2sh.test(address)
  );
}

/**
 * Validates a MARA configuration object
 * @param config - The configuration to validate
 * @throws Error if configuration is invalid
 */
export function validateMaraConfig(config: unknown): asserts config is MaraConfig {
  if (!isMaraConfig(config)) {
    throw new Error('Invalid MARA configuration object');
  }

  // Validate API URL format
  try {
    new URL(config.apiBaseUrl);
  } catch {
    throw new Error(`Invalid MARA API URL: ${config.apiBaseUrl}`);
  }

  // Validate Bitcoin address
  if (!isValidBitcoinAddress(config.serviceFeeAddress)) {
    throw new Error(`Invalid MARA service fee address: ${config.serviceFeeAddress}`);
  }

  // Validate service fee amount
  if (config.serviceFeeAmount !== 42000) {
    throw new Error(
      `Invalid MARA service fee amount: ${config.serviceFeeAmount}. Must be exactly 42000 sats`
    );
  }
}

/**
 * Creates a MaraConfig object from environment variables
 * @returns MaraConfig object or null if MARA is disabled
 */
export function createMaraConfigFromEnv(): MaraConfig | null {
  // MARA is always available - activation depends on user providing outputValue
  const enabled = true;

  // Get environment values with proper fallback handling
  const apiBaseUrl = Deno.env.get('MARA_API_BASE_URL')?.trim() || DEFAULT_MARA_CONFIG.apiBaseUrl;

  const apiTimeoutStr = Deno.env.get('MARA_API_TIMEOUT')?.trim();
  const apiTimeout = apiTimeoutStr ? parseInt(apiTimeoutStr, 10) : DEFAULT_MARA_CONFIG.apiTimeout;

  const serviceFeeAmountStr = Deno.env.get('MARA_SERVICE_FEE_SATS')?.trim();
  const serviceFeeAmount = serviceFeeAmountStr ? parseInt(serviceFeeAmountStr, 10) : DEFAULT_MARA_CONFIG.serviceFeeAmount;

  const serviceFeeAddress = Deno.env.get('MARA_SERVICE_FEE_ADDRESS')?.trim() || DEFAULT_MARA_CONFIG.serviceFeeAddress;

  const config: MaraConfig = {
    apiBaseUrl,
    apiTimeout: isNaN(apiTimeout) ? DEFAULT_MARA_CONFIG.apiTimeout : apiTimeout,
    serviceFeeAmount: isNaN(serviceFeeAmount) ? DEFAULT_MARA_CONFIG.serviceFeeAmount : serviceFeeAmount,
    serviceFeeAddress,
    enabled,
  };

  // Validate the configuration
  validateMaraConfig(config);

  return config;
}

// Re-export DEFAULT_MARA_CONFIG from $constants
export { DEFAULT_MARA_CONFIG } from "$constants";
