/**
 * Type definitions for MARA Slipstream API
 * Defines interfaces for API requests and responses
 */

/**
 * Response from MARA's /rest-api/getinfo endpoint
 * Contains current fee rates and network information
 */
export interface MaraFeeRateResponse {
  /** Current block height */
  block_height: number;
  
  /** Current fee rate in sats/vB */
  fee_rate: number;
  
  /** Network (should be "bitcoin") */
  network: string;
  
  /** Minimum acceptable fee rate in sats/vB (derived from fee_rate) */
  min_fee_rate?: number;
  
  /** Unix timestamp when the rate was generated (added locally) */
  timestamp?: number;
}

/**
 * Request body for MARA's /rest-api/submit-tx endpoint
 * Contains the signed transaction data to submit
 */
export interface MaraSubmitRequest {
  /** Signed transaction hex string */
  hex: string;
  
  /** Transaction priority level */
  priority: "high" | "medium" | "low";
}

/**
 * Response from MARA's /rest-api/submit-tx endpoint
 * Contains submission status and transaction details
 */
export interface MaraSubmissionResponse {
  /** Transaction ID of the submitted transaction */
  txid: string;
  
  /** Current status of the submission */
  status: 'accepted' | 'pending' | 'rejected';
  
  /** Optional message with additional details */
  message?: string;
  
  /** Estimated blocks until confirmation */
  estimated_confirmation?: number;
  
  /** Pool priority level assigned */
  pool_priority?: number;
  
  /** Unix timestamp of submission */
  submission_time: number;
  
  /** Error code if submission failed */
  error_code?: string;
}

/**
 * Configuration for MARA integration
 * Contains all settings needed for MARA API interaction
 */
export interface MaraConfig {
  /** Base URL for MARA API */
  API_BASE_URL: string;
  
  /** Request timeout in milliseconds */
  API_TIMEOUT: number;
  
  /** How long to cache fee rates in seconds */
  FEE_CACHE_DURATION: number;
  
  /** Service fee amount in satoshis for MARA pool access */
  SERVICE_FEE_SATS: number;
  
  /** Bitcoin address for service fee payment */
  SERVICE_FEE_ADDRESS: string;
  
  /** Minimum allowed output value in satoshis */
  MIN_OUTPUT_VALUE: number;
  
  /** Maximum allowed output value in satoshis */
  MAX_OUTPUT_VALUE: number;
}

/**
 * Error response from MARA API
 * Standard error format for API failures
 */
export interface MaraErrorResponse {
  /** Error message */
  error: string;
  
  /** HTTP status code */
  status: number;
  
  /** Optional error code for specific error types */
  code?: string;
  
  /** Optional additional error details */
  details?: Record<string, any>;
}