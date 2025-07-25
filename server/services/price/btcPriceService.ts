import { dbManager, type DatabaseManager } from "$/server/database/databaseManager.ts";
import { FetchHttpClient } from "$/server/interfaces/httpClient.ts";
import {
  createPriceServiceCircuitBreaker,
  type CircuitBreakerMetrics
} from "$/server/utils/circuitBreaker.ts";
import { COINGECKO_API_BASE_URL } from "$constants";
import { getCacheConfig, RouteType } from "$server/services/infrastructure/cacheService.ts";

const BINANCE_API_BASE_URL = "https://api.binance.com/api/v3";
const KRAKEN_API_BASE_URL = "https://api.kraken.com/0/public";
const COINBASE_API_BASE_URL = "https://api.coinbase.com/v2";
const BLOCKCHAIN_API_BASE_URL = "https://blockchain.info";
const BITSTAMP_API_BASE_URL = "https://www.bitstamp.net/api/v2";

// Create httpClient instance
const httpClient = new FetchHttpClient(
  10000, // 10 second timeout for price APIs
  3,     // 3 retries
  1000   // 1 second retry delay
);

export interface BTCPriceData {
  price: number;
  source: "quicknode" | "coingecko" | "binance" | "kraken" | "coinbase" | "blockchain" | "bitstamp" | "cached" | "default";
  confidence: "high" | "medium" | "low";
  timestamp: number;
  details?: any;
  fallbackUsed?: boolean;
  errors?: string[];
  circuitBreakerMetrics?: Record<string, CircuitBreakerMetrics>;
}

export class BTCPriceService {
  private static db: DatabaseManager = dbManager;

  // Circuit breakers for each price source
  private static circuitBreakers = {
    coingecko: createPriceServiceCircuitBreaker("CoinGecko"),
    binance: createPriceServiceCircuitBreaker("Binance"),
    kraken: createPriceServiceCircuitBreaker("Kraken"),
    coinbase: createPriceServiceCircuitBreaker("Coinbase"),
    blockchain: createPriceServiceCircuitBreaker("Blockchain.info"),
    bitstamp: createPriceServiceCircuitBreaker("Bitstamp"),
  };

  static setDatabase(database: DatabaseManager): void {
    this.db = database;
  }

  private static readonly CACHE_KEY = "btc_price_data";
  private static readonly CACHE_CONFIG = getCacheConfig(RouteType.PRICE);
  private static sourceCounter = 0;

  // Updated sources array with multiple fallback options for reliability
  // Sources are ordered by reliability and response time
  private static readonly SOURCES = ["coingecko", "kraken", "coinbase", "bitstamp", "blockchain", "binance"] as const;
  // To re-enable QuickNode when subscription is restored: add "quicknode" at the beginning

  /**
   * Get BTC price with Redis caching and comprehensive fallback
   */
  static async getPrice(preferredSource?: string): Promise<BTCPriceData> {
    const startTime = Date.now();

    try {
      console.log(`[BTCPriceService] Starting BTC price fetch with Redis caching, preferredSource: ${preferredSource}`);

      const cachedData = await this.db.handleCache<BTCPriceData | null>(this.CACHE_KEY, () => Promise.resolve(null), this.CACHE_CONFIG.duration);

      if (cachedData && this.isCacheValid(cachedData)) {
        return {
          ...cachedData,
          source: "cached",
          circuitBreakerMetrics: this.getCircuitBreakerMetrics(),
        };
      }

      // Fetch fresh data
      console.log(`[BTCPriceService] Cache miss or stale data, fetching fresh price...`);
      const freshData = await this.fetchFreshPriceData(preferredSource);

      // Cache the result
      if (freshData.source !== "default") {
        await this.db.handleCache(this.CACHE_KEY, () => Promise.resolve(freshData), this.CACHE_CONFIG.duration);
      }

      return {
        ...freshData,
        circuitBreakerMetrics: this.getCircuitBreakerMetrics(),
      };
    } catch (error) {
      console.error("[BTCPriceService] Failed to get BTC price:", error);
      return {
        ...this.getStaticFallbackPrice(),
        errors: [error instanceof Error ? error.message : String(error)],
        circuitBreakerMetrics: this.getCircuitBreakerMetrics(),
      };
    } finally {
      console.log(`[BTCPriceService] Request completed in ${Date.now() - startTime}ms`);
    }
  }

  private static isCacheValid(data: BTCPriceData): boolean {
    const age = Date.now() - data.timestamp;
    return age < this.CACHE_CONFIG.duration * 1000;
  }

  /**
   * Fetch fresh price data from external sources with fallback chain
   */
  private static async fetchFreshPriceData(preferredSource?: string): Promise<BTCPriceData> {
    const errors: string[] = [];

    console.log(`[BTCPriceService] Fetching fresh BTC price from external sources, preferredSource: ${preferredSource}`);

    // Determine source order, filtering out permanently disabled sources
    const availableSources = this.getAvailableSources();
    const sources = preferredSource && availableSources.includes(preferredSource)
      ? [preferredSource, ...availableSources.filter(s => s !== preferredSource)]
      : this.getNextSourceOrder();

    console.log(`[BTCPriceService] Source order: ${sources.join(' → ')}`);

    // Try each source in order
    for (const source of sources) {
      try {
        console.log(`[BTCPriceService] Attempting to fetch from ${source}...`);
        const result = await this.fetchFromSource(source);
        if (result) {
          console.log(`[BTCPriceService] BTC price source (${source}) successful: $${result.price}`);

          return {
            ...result,
            timestamp: Date.now(),
            fallbackUsed: source !== sources[0],
            ...(errors.length > 0 && { errors }),
          };
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`${source}: ${errorMessage}`);

        // Only log simple message for expected errors with fallbacks
        const isRateLimitError = errorMessage.includes('429');
        if (isRateLimitError) {
          console.log(`[BTCPriceService] ${source} rate limited, trying next source...`);
        } else {
          console.warn(`[BTCPriceService] ${source} failed: ${errorMessage}`);
        }
      }
    }

    // All sources failed - use static fallback
    console.warn(`[BTCPriceService] All BTC price sources failed, using static fallback. Errors:`, errors);

    return {
      ...this.getStaticFallbackPrice(),
      errors,
    };
  }

  /**
   * Get round-robin source order
   */
  private static getNextSourceOrder(): string[] {
    // Filter out permanently disabled sources
    const availableSources = this.getAvailableSources();

    if (availableSources.length === 0) {
      console.warn("[BTCPriceService] No available price sources - all are permanently disabled");
      return [];
    }

    const primaryIndex = this.sourceCounter % availableSources.length;
    this.sourceCounter = (this.sourceCounter + 1) % Number.MAX_SAFE_INTEGER;

    const primary = availableSources[primaryIndex];
    const remaining = availableSources.filter(s => s !== primary);

    return [primary, ...remaining];
  }

  /**
   * Get list of available (non-permanently disabled) sources
   */
  private static getAvailableSources(): string[] {
    return this.SOURCES.filter(source => {
      const breaker = this.circuitBreakers[source as keyof typeof this.circuitBreakers];
      return breaker && !breaker.isPermanentlyDisabled();
    });
  }

  /**
   * Fetch price from specific source
   */
  private static async fetchFromSource(source: string): Promise<Omit<BTCPriceData, 'timestamp' | 'fallbackUsed' | 'errors'> | null> {
    switch (source) {
      // QuickNode disabled - no longer subscribed to cg_simplePrice addon
      // case "quicknode":
      //   return await this.fetchFromQuickNode();
      case "coingecko":
        return await this.fetchFromCoinGecko();
      case "binance":
        return await this.fetchFromBinance();
      case "kraken":
        return await this.fetchFromKraken();
      case "coinbase":
        return await this.fetchFromCoinbase();
      case "blockchain":
        return await this.fetchFromBlockchain();
      case "bitstamp":
        return await this.fetchFromBitstamp();
      default:
        throw new Error(`Unknown price source: ${source}`);
    }
  }

  /**
   * Fetch from QuickNode (DISABLED - no longer subscribed to cg_simplePrice addon)
   * Keeping this method commented out in case subscription is restored
   */
  /*
  private static async fetchFromQuickNode(): Promise<Omit<BTCPriceData, 'timestamp' | 'fallbackUsed' | 'errors'> | null> {
    try {
      const params = ["bitcoin", "usd", true, true, true];
      const response = await CachedQuicknodeRPCService.executeRPC<{
        bitcoin: {
          usd: number;
          usd_market_cap: number;
          usd_24h_vol: number;
          usd_24h_change: number;
        };
      }>(
        "cg_simplePrice",
        params,
        300 // 5-minute cache for RPC calls
      );

      if ("error" in response) {
        console.error("[BTCPriceService] QuickNode price error:", response.error);
        throw new Error(response.error);
      }

      const price = response.result.bitcoin.usd;
      console.log(`[BTCPriceService] QuickNode price result: $${price}`);

      return {
        price,
        source: "quicknode",
        confidence: "high",
        details: response.result,
      };
    } catch (error) {
      console.error("[BTCPriceService] QuickNode price fetch failed:", error);
      throw error;
    }
  }
  */

  /**
   * Fetch from CoinGecko with circuit breaker protection
   */
  private static async fetchFromCoinGecko(): Promise<Omit<BTCPriceData, 'timestamp' | 'fallbackUsed' | 'errors'> | null> {
    return await this.circuitBreakers.coingecko.execute(async () => {
      const response = await httpClient.get(`${COINGECKO_API_BASE_URL}/simple/price?ids=bitcoin&vs_currencies=usd`);

      if (response.status !== 200) {
        // Handle specific error types for circuit breaker
        if (response.status === 429) {
          const error = new Error(`CoinGecko API rate limit (${response.status})`);
          error.name = "RateLimitError";
          throw error;
        }
        if (response.status === 451) {
          const error = new Error(`CoinGecko API unavailable for legal reasons (${response.status})`);
          error.name = "LegalRestrictionError";
          throw error;
        }
        if (response.status >= 500) {
          const error = new Error(`CoinGecko API server error (${response.status})`);
          error.name = "ServerError";
          throw error;
        }
        throw new Error(`CoinGecko API returned ${response.status}`);
      }

      const data = response.data;
      const price = data.bitcoin?.usd;

      if (!price || typeof price !== 'number' || price <= 0) {
        throw new Error("Invalid price data from CoinGecko");
      }

      console.log(`[BTCPriceService] CoinGecko price result: $${price}`);

      return {
        price,
        source: "coingecko" as const,
        confidence: "high" as const,
        details: data,
      };
    });
  }

  /**
   * Fetch from Binance with circuit breaker protection (Free API - no authentication required)
   */
  private static async fetchFromBinance(): Promise<Omit<BTCPriceData, 'timestamp' | 'fallbackUsed' | 'errors'> | null> {
    return await this.circuitBreakers.binance.execute(async () => {
      const response = await httpClient.get(`${BINANCE_API_BASE_URL}/ticker/price?symbol=BTCUSDT`);

      if (response.status !== 200) {
        // Handle specific error types for circuit breaker
        if (response.status === 429) {
          const error = new Error(`Binance API rate limit (${response.status})`);
          error.name = "RateLimitError";
          throw error;
        }
        if (response.status === 451) {
          const error = new Error(`Binance API unavailable for legal reasons (${response.status})`);
          error.name = "LegalRestrictionError";
          throw error;
        }
        if (response.status >= 500) {
          const error = new Error(`Binance API server error (${response.status})`);
          error.name = "ServerError";
          throw error;
        }
        throw new Error(`Binance API returned ${response.status}`);
      }

      const data = response.data;
      const price = parseFloat(data.price);

      if (!price || isNaN(price) || price <= 0) {
        throw new Error("Invalid price data from Binance");
      }

      console.log(`[BTCPriceService] Binance price result: $${price}`);

      return {
        price,
        source: "binance" as const,
        confidence: "high" as const,
        details: data,
      };
    });
  }

  /**
   * Fetch from Kraken with circuit breaker protection (Free API)
   */
  private static async fetchFromKraken(): Promise<Omit<BTCPriceData, 'timestamp' | 'fallbackUsed' | 'errors'> | null> {
    return await this.circuitBreakers.kraken.execute(async () => {
      const response = await httpClient.get(`${KRAKEN_API_BASE_URL}/Ticker?pair=XBTUSD`);

      if (response.status !== 200) {
        if (response.status === 429) {
          const error = new Error(`Kraken API rate limit (${response.status})`);
          error.name = "RateLimitError";
          throw error;
        }
        if (response.status === 451) {
          const error = new Error(`Kraken API unavailable for legal reasons (${response.status})`);
          error.name = "LegalRestrictionError";
          throw error;
        }
        if (response.status >= 500) {
          const error = new Error(`Kraken API server error (${response.status})`);
          error.name = "ServerError";
          throw error;
        }
        throw new Error(`Kraken API returned ${response.status}`);
      }

      const data = response.data;
      if (data.error && data.error.length > 0) {
        throw new Error(`Kraken API error: ${data.error.join(', ')}`);
      }

      const price = parseFloat(data.result?.XXBTZUSD?.c?.[0]);
      if (!price || isNaN(price) || price <= 0) {
        throw new Error("Invalid price data from Kraken");
      }

      console.log(`[BTCPriceService] Kraken price result: $${price}`);

      return {
        price,
        source: "kraken" as const,
        confidence: "high" as const,
        details: data.result,
      };
    });
  }

  /**
   * Fetch from Coinbase with circuit breaker protection (Free API)
   */
  private static async fetchFromCoinbase(): Promise<Omit<BTCPriceData, 'timestamp' | 'fallbackUsed' | 'errors'> | null> {
    return await this.circuitBreakers.coinbase.execute(async () => {
      const response = await httpClient.get(`${COINBASE_API_BASE_URL}/exchange-rates?currency=BTC`);

      if (response.status !== 200) {
        if (response.status === 429) {
          const error = new Error(`Coinbase API rate limit (${response.status})`);
          error.name = "RateLimitError";
          throw error;
        }
        if (response.status === 451) {
          const error = new Error(`Coinbase API unavailable for legal reasons (${response.status})`);
          error.name = "LegalRestrictionError";
          throw error;
        }
        if (response.status >= 500) {
          const error = new Error(`Coinbase API server error (${response.status})`);
          error.name = "ServerError";
          throw error;
        }
        throw new Error(`Coinbase API returned ${response.status}`);
      }

      const data = response.data;
      const price = parseFloat(data.data?.rates?.USD);

      if (!price || isNaN(price) || price <= 0) {
        throw new Error("Invalid price data from Coinbase");
      }

      console.log(`[BTCPriceService] Coinbase price result: $${price}`);

      return {
        price,
        source: "coinbase" as const,
        confidence: "high" as const,
        details: data.data,
      };
    });
  }

  /**
   * Fetch from Blockchain.info with circuit breaker protection (Free API)
   */
  private static async fetchFromBlockchain(): Promise<Omit<BTCPriceData, 'timestamp' | 'fallbackUsed' | 'errors'> | null> {
    return await this.circuitBreakers.blockchain.execute(async () => {
      const response = await httpClient.get(`${BLOCKCHAIN_API_BASE_URL}/ticker`);

      if (response.status !== 200) {
        if (response.status === 429) {
          const error = new Error(`Blockchain.info API rate limit (${response.status})`);
          error.name = "RateLimitError";
          throw error;
        }
        if (response.status === 451) {
          const error = new Error(`Blockchain.info API unavailable for legal reasons (${response.status})`);
          error.name = "LegalRestrictionError";
          throw error;
        }
        if (response.status >= 500) {
          const error = new Error(`Blockchain.info API server error (${response.status})`);
          error.name = "ServerError";
          throw error;
        }
        throw new Error(`Blockchain.info API returned ${response.status}`);
      }

      const data = response.data;
      const price = data.USD?.last;

      if (!price || typeof price !== 'number' || price <= 0) {
        throw new Error("Invalid price data from Blockchain.info");
      }

      console.log(`[BTCPriceService] Blockchain.info price result: $${price}`);

      return {
        price,
        source: "blockchain" as const,
        confidence: "high" as const,
        details: data.USD,
      };
    });
  }

  /**
   * Fetch from Bitstamp with circuit breaker protection (Free API)
   */
  private static async fetchFromBitstamp(): Promise<Omit<BTCPriceData, 'timestamp' | 'fallbackUsed' | 'errors'> | null> {
    return await this.circuitBreakers.bitstamp.execute(async () => {
      const response = await httpClient.get(`${BITSTAMP_API_BASE_URL}/ticker/btcusd`);

      if (response.status !== 200) {
        if (response.status === 429) {
          const error = new Error(`Bitstamp API rate limit (${response.status})`);
          error.name = "RateLimitError";
          throw error;
        }
        if (response.status === 451) {
          const error = new Error(`Bitstamp API unavailable for legal reasons (${response.status})`);
          error.name = "LegalRestrictionError";
          throw error;
        }
        if (response.status >= 500) {
          const error = new Error(`Bitstamp API server error (${response.status})`);
          error.name = "ServerError";
          throw error;
        }
        throw new Error(`Bitstamp API returned ${response.status}`);
      }

      const data = response.data;
      const price = parseFloat(data.last);

      if (!price || isNaN(price) || price <= 0) {
        throw new Error("Invalid price data from Bitstamp");
      }

      console.log(`[BTCPriceService] Bitstamp price result: $${price}`);

      return {
        price,
        source: "bitstamp" as const,
        confidence: "high" as const,
        details: data,
      };
    });
  }

  /**
   * Get static fallback price
   */
  private static getStaticFallbackPrice(): BTCPriceData {
    return {
      price: 0,
      source: "default",
      confidence: "low",
      timestamp: Date.now(),
      fallbackUsed: true,
      details: {
        static_fallback: true,
        reason: "All price sources failed",
      },
    };
  }

  /**
   * Invalidate price cache (useful for testing or manual refresh)
   */
  static invalidateCache(): Promise<void> {
    try {
      return this.db.invalidateCacheByPattern(this.CACHE_KEY)
        .then(() => {
          console.log("[BTCPriceService] BTC price cache invalidated");
        });
    } catch (_error) {
      console.error("[BTCPriceService] Failed to invalidate BTC price cache:", _error);
      return Promise.resolve();
    }
  }

  /**
   * Get cache status information
   */
  static getCacheInfo(): {
    cacheKey: string;
    cacheDuration: number;
    staleWhileRevalidate: number;
    staleIfError: number;
  } {
    return {
      cacheKey: this.CACHE_KEY,
      cacheDuration: this.CACHE_CONFIG.duration,
      staleWhileRevalidate: this.CACHE_CONFIG.staleWhileRevalidate,
      staleIfError: this.CACHE_CONFIG.staleIfError,
    };
  }

  /**
   * Get circuit breaker metrics for all sources
   */
  private static getCircuitBreakerMetrics(): Record<string, CircuitBreakerMetrics> {
    const metrics: Record<string, CircuitBreakerMetrics> = {};
    for (const [name, breaker] of Object.entries(this.circuitBreakers)) {
      metrics[name] = breaker.getMetrics();
    }
    return metrics;
  }

  /**
   * Get health status of all price sources
   */
  static getHealthStatus(): Record<string, boolean> {
    const health: Record<string, boolean> = {};
    for (const [name, breaker] of Object.entries(this.circuitBreakers)) {
      health[name] = breaker.isHealthy();
    }
    return health;
  }

  /**
   * Reset circuit breakers (for testing/admin purposes)
   */
  static resetCircuitBreakers(): void {
    for (const breaker of Object.values(this.circuitBreakers)) {
      breaker.reset();
    }
    console.log("[BTCPriceService] All circuit breakers reset");
  }

  /**
   * Get detailed service metrics including circuit breaker status
   */
  static getServiceMetrics(): {
    circuitBreakers: Record<string, CircuitBreakerMetrics>;
    healthStatus: Record<string, boolean>;
    permanentlyDisabled: Record<string, boolean>;
    sources: string[];
    availableSources: string[];
  } {
    const permanentlyDisabled: Record<string, boolean> = {};
    for (const [name, breaker] of Object.entries(this.circuitBreakers)) {
      permanentlyDisabled[name] = breaker.isPermanentlyDisabled();
    }

    return {
      circuitBreakers: this.getCircuitBreakerMetrics(),
      healthStatus: this.getHealthStatus(),
      permanentlyDisabled,
      sources: [...this.SOURCES],
      availableSources: this.getAvailableSources(),
    };
  }

}
