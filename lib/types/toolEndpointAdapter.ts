/**
 * Tool Endpoint Adapter Interfaces
 *
 * Provides standardized interfaces for calling different tool endpoints with dryRun
 * parameter and normalizing their responses for the TransactionConstructionService system.
 *
 * This eliminates the need for redundant /api/internal/utxoquery calls by allowing
 * Phase 2 to directly call tool endpoints with dryRun=true.
 */

import type { SRC101TransactionOptions } from "$types/src101.d.ts";
import type { SRC20TransactionOptions } from "$types/src20.d.ts";
import type { StampTransactionOptions } from "$types/stamp.d.ts";

/**
 * Standardized fee response interface that all tool adapters must return
 */
export interface StandardFeeResponse {
  /** Transaction size in bytes */
  estimatedSize: number;
  /** Miner fee in satoshis */
  minerFee: number;
  /** Dust value for outputs in satoshis */
  dustValue: number;
  /** Total transaction cost in satoshis (includes miner fee + dust) */
  totalCost: number;
  /** Whether this is an estimate (always true for dryRun) */
  isEstimate: boolean;
  /** Method used for estimation */
  estimationMethod: string;
  /** Applied fee rate in sats/vB */
  feeRate: number;
  /** Optional detailed fee breakdown from the tool */
  feeDetails?: any;
  /** Optional change value in satoshis */
  changeValue?: number;
  /** Optional input value in satoshis */
  inputValue?: number;
}

/**
 * Common transaction options that all tools should support
 */
export interface TransactionOptions {
  /** Source wallet address */
  walletAddress: string;
  /** Fee rate in sats/vB */
  feeRate: number;
  /** Always true for Phase 2 estimation */
  dryRun: boolean;
  /** Optional change address (defaults to source) */
  changeAddress?: string;
}

/**
 * Stamp-specific transaction options
 */
export interface StampTransactionOptions extends TransactionOptions {
  /** Base64 encoded file data */
  file: string;
  /** Original filename */
  filename: string;
  /** File size in bytes */
  fileSize: number;
  /** Quantity to mint */
  quantity: number;
  /** Whether asset is locked */
  locked: boolean;
  /** Whether asset is divisible */
  divisible: boolean;
  /** Custom output value for MARA mode (optional) */
  outputValue?: number;

  // Optional dispense-specific properties for stamp purchases
  /** Dispenser source address (for purchases) */
  dispenserSource?: string;
  /** Purchase quantity in satoshis (for purchases) */
  purchaseQuantity?: string;
}

/**
 * SRC-20 specific transaction options
 */
export interface SRC20TransactionOptions extends TransactionOptions {
  /** SRC-20 operation type */
  op: "DEPLOY" | "MINT" | "TRANSFER";
  /** Token ticker */
  tick: string;
  /** Maximum supply (for DEPLOY) */
  max?: string;
  /** Mint limit per transaction (for DEPLOY) */
  lim?: string;
  /** Decimal places (for DEPLOY) */
  dec?: number;
  /** Amount to mint/transfer */
  amt?: string;
  /** Destination address (for TRANSFER) */
  destinationAddress?: string;
}

/**
 * SRC-101 specific transaction options
 */
export interface SRC101TransactionOptions extends TransactionOptions {
  /** SRC-101 operation type */
  op: "deploy" | "mint" | "transfer";
  /** Root domain name */
  root?: string;
  /** Subdomain name */
  name?: string;
  /** Amount to transfer */
  amt?: string;
  /** Destination address (for transfer) */
  destinationAddress?: string;
}

/**
 * Tool type enumeration
 */
export type ToolType = "stamp" | "src20" | "src101";

/**
 * Union type for all possible transaction options
 */
export type AnyTransactionOptions =
  | StampTransactionOptions
  | SRC20TransactionOptions
  | SRC101TransactionOptions;

/**
 * Generic tool endpoint adapter interface
 */
export interface ToolEndpointAdapter<
  T extends TransactionOptions = TransactionOptions,
> {
  /** Tool type identifier */
  readonly toolType: ToolType;

  /** API endpoint URL */
  readonly endpoint: string;

  /**
   * Build the request body for the tool endpoint
   * @param options Transaction options specific to this tool
   * @returns Request body object
   */
  buildRequestBody(options: T): Record<string, any>;

  /**
   * Parse the tool endpoint response and normalize to standard format
   * @param response Raw response from the tool endpoint
   * @returns Normalized fee response
   */
  parseResponse(response: any): StandardFeeResponse;

  /**
   * Validate that the required options are present for this tool
   * @param options Transaction options to validate
   * @returns True if valid, throws error if invalid
   */
  validateOptions(options: T): boolean;

  /**
   * Get the cache key for this request (for response caching)
   * @param options Transaction options
   * @returns Cache key string
   */
  getCacheKey(options: T): string;
}

/**
 * Tool endpoint adapter factory interface
 */
export interface ToolEndpointAdapterFactory {
  /**
   * Create an adapter for the specified tool type
   * @param toolType Type of tool to create adapter for
   * @returns Appropriate adapter instance
   */
  createAdapter(toolType: ToolType): ToolEndpointAdapter;

  /**
   * Get all supported tool types
   * @returns Array of supported tool types
   */
  getSupportedToolTypes(): ToolType[];
}

/**
 * Error types for tool endpoint operations
 */
export class ToolEndpointError extends Error {
  constructor(
    message: string,
    public readonly toolType: ToolType,
    public readonly endpoint: string,
    public readonly originalError?: Error,
  ) {
    super(message);
    this.name = "ToolEndpointError";
  }
}

export class ToolValidationError extends ToolEndpointError {
  constructor(
    message: string,
    toolType: ToolType,
    endpoint: string,
    public readonly invalidFields: string[],
  ) {
    super(message, toolType, endpoint);
    this.name = "ToolValidationError";
  }
}

export class ToolResponseError extends ToolEndpointError {
  constructor(
    message: string,
    toolType: ToolType,
    endpoint: string,
    public readonly response: any,
    originalError?: Error,
  ) {
    super(message, toolType, endpoint, originalError);
    this.name = "ToolResponseError";
  }
}
