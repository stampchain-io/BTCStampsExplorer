/**
 * Tool Endpoint Adapter Interfaces
 *
 * Provides standardized interfaces for calling different tool endpoints with dryRun
 * parameter and normalizing their responses for the TransactionConstructionService system.
 *
 * This eliminates the need for redundant /api/internal/utxoquery calls by allowing
 * Phase 2 to directly call tool endpoints with dryRun=true.
 */

import type { TransactionOptions } from "$types/base.d.ts";

import type { SRC101TransactionOptions } from "$types/src101.d.ts";
import type { SRC20TransactionOptions } from "$types/src20.d.ts";
import type { StampTransactionOptions } from "$types/stamp.d.ts";

// Re-export transaction options for use by other modules
export type {
  SRC101TransactionOptions,
  SRC20TransactionOptions,
  StampTransactionOptions,
};

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
  feeDetails: any | undefined;
  /** Optional change value in satoshis */
  changeValue: number | undefined;
  /** Optional input value in satoshis */
  inputValue: number | undefined;
}

// StampTransactionOptions imported from $types/stamp.d.ts

// SRC20TransactionOptions imported from $types/src20.d.ts

// SRC101TransactionOptions imported from $types/src101.d.ts

/**
 * Tool type enumeration
 */
export type ToolType = "stamp" | "src20" | "src101";

// ToolProtocolComplianceLevel is now imported from $constants
export { ToolProtocolComplianceLevel as ProtocolComplianceLevel } from "$constants";

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

// Re-exports for types commonly imported from this adapter
export type { FeeAlert, ToolEstimationParams } from "$types/fee.d.ts";
export type { InputData } from "$types/src20.d.ts";
export type {
  ColumnDefinition,
  MockResponse,
  NamespaceImport,
  XcpBalance,
} from "$types/ui.d.ts";
