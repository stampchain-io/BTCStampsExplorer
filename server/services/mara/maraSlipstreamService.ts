/**
 * MARA Slipstream Service
 * Handles integration with MARA pool's Slipstream API for submitting
 * non-standard transactions with custom dust values (1-332 sats)
 */

import { FetchHttpClient } from "$/server/interfaces/httpClient.ts";
import { createPriceServiceCircuitBreaker } from "$/server/utils/circuitBreaker.ts";
import { logger } from "$lib/utils/monitoring/logging/logger.ts";
import { getMaraConfig } from "$/server/config/config.ts";
import { assertValidMaraConfig } from "$/server/config/maraConfigValidator.ts";
import type {
  MaraFeeRateResponse,
  MaraSubmissionResponse,
  MaraErrorResponse
} from "./types.ts";

// Configuration constants
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Service for interacting with MARA Slipstream API
 * Provides methods for fetching fee rates and submitting transactions
 */
export class MaraSlipstreamService {
  // Lazy initialization of configuration and HTTP client
  private static _config: ReturnType<typeof assertValidMaraConfig> | null = null;
  private static _httpClient: FetchHttpClient | null = null;

  // Circuit breaker to handle API failures gracefully
  private static circuitBreaker = createPriceServiceCircuitBreaker("MaraSlipstream");

  /**
   * Get MARA configuration, initializing if needed
   * @throws Error if MARA is not properly configured
   */
  private static get config() {
    if (!this._config) {
      this._config = assertValidMaraConfig();
    }
    return this._config;
  }

  /**
   * Get HTTP client, initializing if needed
   */
  private static get httpClient() {
    if (!this._httpClient) {
      const config = this.config;
      this._httpClient = new FetchHttpClient(
        config.apiTimeout,
        MAX_RETRIES,
        RETRY_DELAY
      );
    }
    return this._httpClient;
  }

  /**
   * Fetch current fee rate from MARA API
   * This rate must be used for transactions to be accepted by the pool
   * 
   * @returns Promise<MaraFeeRateResponse> Current fee rate information
   * @throws Error if API call fails or circuit breaker is open
   */
  static async getFeeRate(): Promise<MaraFeeRateResponse> {
    const config = this.config;
    const endpoint = `${config.apiBaseUrl}/getinfo`;
    const startTime = Date.now();
    
    logger.info("mara", {
      message: "Fetching MARA pool info",
      endpoint
    });

    try {
      // Execute request through circuit breaker for resilience
      const response = await this.circuitBreaker.execute(async () => {
        const result = await this.httpClient.get<MaraFeeRateResponse>(endpoint);
        
        if (!result.ok) {
          const errorData = result.data as unknown as MaraErrorResponse;
          throw new Error(
            `MARA API error: ${result.status} - ${errorData?.error || result.statusText}`
          );
        }

        // Validate response structure
        if (!result.data || 
            typeof result.data.fee_rate !== 'number' ||
            typeof result.data.block_height !== 'number' ||
            typeof result.data.network !== 'string') {
          throw new Error("Invalid response structure from MARA getinfo endpoint");
        }

        // Add computed fields to match expected interface
        const enhancedResponse: MaraFeeRateResponse = {
          ...result.data,
          min_fee_rate: result.data.fee_rate, // Use fee_rate as minimum
          timestamp: Date.now()
        };

        return enhancedResponse;
      });

      const responseTime = Date.now() - startTime;

      logger.info("mara", {
        message: "Successfully fetched MARA info",
        blockHeight: response.block_height,
        feeRate: response.fee_rate,
        network: response.network,
        responseTime
      });

      return response;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      logger.error("mara", {
        message: "Failed to fetch MARA fee rate",
        error: errorMessage,
        endpoint,
        responseTime
      });
      throw error;
    }
  }

  /**
   * Submit a signed transaction to MARA pool
   * Transaction must use the fee rate obtained from getFeeRate()
   * 
   * @param hex - Signed transaction hex string
   * @param priority - Transaction priority (default: "high")
   * @param metadata - Additional metadata for tracking
   * @returns Promise<MaraSubmissionResponse> Submission result
   * @throws Error if submission fails or circuit breaker is open
   */
  static async submitTransaction(
    hex: string,
    priority: "high" | "medium" | "low" = "high"
  ): Promise<MaraSubmissionResponse> {
    const config = this.config;
    const endpoint = `${config.apiBaseUrl}/submit-tx`;
    const startTime = Date.now();
    
    // Validate hex string
    if (!hex || typeof hex !== 'string' || hex.length === 0) {
      throw new Error("Invalid transaction hex provided");
    }

    logger.info("mara", {
      message: "Submitting transaction to MARA pool",
      endpoint,
      hexLength: hex.length,
      priority,
      hexPreview: hex.substring(0, 20) + "..."
    });

    try {
      // Execute request through circuit breaker
      const response = await this.circuitBreaker.execute(async () => {
        // MARA API expects JSON with hex field
        const requestBody = { hex, priority };
        
        const result = await this.httpClient.post<MaraSubmissionResponse>(
          endpoint,
          requestBody
        );
        
        if (!result.ok) {
          let errorMessage = `MARA submission error: ${result.status}`;
          
          // Try to extract error message from various response formats
          if (typeof result.data === 'string' && result.data.trim()) {
            errorMessage += ` - ${result.data}`;
          } else if (result.data && typeof result.data === 'object') {
            const errorData = result.data as any;
            // Check various possible error fields
            if (errorData.error) {
              errorMessage += ` - ${errorData.error}`;
            } else if (errorData.message) {
              errorMessage += ` - ${errorData.message}`;
            } else if (errorData.detail) {
              errorMessage += ` - ${errorData.detail}`;
            } else if (errorData.status === 'error' && errorData.message) {
              errorMessage += ` - ${errorData.message}`;
            }
          } else {
            errorMessage += ` - ${result.statusText}`;
          }
          
          // Log detailed error information
          logger.error("mara", {
            message: "MARA API returned error response",
            status: result.status,
            statusText: result.statusText,
            responseData: typeof result.data === 'string' && result.data.includes('<!DOCTYPE') 
              ? 'HTML error page' 
              : result.data,
            responseType: typeof result.data,
            endpoint,
            hexLength: hex.length
          });
          
          // Special handling for gateway errors
          if (result.status === 502 || result.status === 503 || result.status === 504) {
            throw new Error(`MARA service temporarily unavailable (${result.status})`);
          }
          
          throw new Error(errorMessage);
        }

        // Handle JSON response from MARA
        const responseData = result.data;
        
        // Validate response structure
        if (!responseData || typeof responseData !== 'object') {
          throw new Error("Invalid submission response format from MARA API");
        }
        
        // Check for success response - MARA returns txid on success
        if (!responseData.txid && !responseData.error && !responseData.message) {
          throw new Error("Invalid MARA response: missing required fields");
        }

        return responseData;
      });

      const submissionTime = Date.now() - startTime;

      logger.info("mara", {
        message: "Successfully submitted transaction to MARA pool",
        txid: response.txid,
        status: response.status,
        estimatedConfirmation: response.estimated_confirmation,
        poolPriority: response.pool_priority,
        submissionTime
      });

      return response;
    } catch (error) {
      const submissionTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : String(error);

      logger.error("mara", {
        message: "Failed to submit transaction to MARA pool",
        error: errorMessage,
        endpoint,
        hexLength: hex.length,
        submissionTime
      });
      throw error;
    }
  }

  /**
   * Get the current state of the circuit breaker
   * Useful for monitoring and debugging
   * 
   * @returns Circuit breaker metrics
   */
  static getCircuitBreakerMetrics() {
    return this.circuitBreaker.getMetrics();
  }

  /**
   * Reset the circuit breaker (for admin/testing purposes)
   * This will close an open circuit and reset failure counts
   */
  static resetCircuitBreaker(): void {
    logger.warn("mara", {
      message: "Manually resetting MARA circuit breaker"
    });
    this.circuitBreaker.reset();
  }

  /**
   * Check if the service is currently available
   * Returns false if circuit breaker is open
   * 
   * @returns boolean indicating service availability
   */
  static isAvailable(): boolean {
    return this.circuitBreaker.isHealthy();
  }

  /**
   * Check if the service is properly configured
   * @returns boolean indicating if MARA service can be used
   */
  static isConfigured(): boolean {
    try {
      const config = getMaraConfig();
      return config !== null && config.enabled;
    } catch {
      return false;
    }
  }

  /**
   * Get current MARA configuration (for debugging/monitoring)
   * @returns Current configuration or null if not configured
   */
  static getConfiguration() {
    try {
      return this.config;
    } catch {
      return null;
    }
  }
}