import { CachedQuicknodeRPCService } from "$server/services/quicknode/cachedQuicknodeRpcService.ts";
import { dbManager } from "$server/database/databaseManager.ts";
import { RouteType, getCacheConfig } from "$server/services/cacheService.ts";
import { COINGECKO_API_BASE_URL } from "$lib/utils/constants.ts";

export interface BTCPriceData {
  price: number;
  source: "quicknode" | "coingecko" | "cached" | "default";
  confidence: "high" | "medium" | "low";
  timestamp: number;
  details?: any;
  fallbackUsed?: boolean;
  errors?: string[];
}

export class BTCPriceService {
  private static readonly CACHE_KEY = "btc_price_data";
  private static readonly CACHE_CONFIG = getCacheConfig(RouteType.PRICE);
  private static sourceCounter = 0;
  private static readonly SOURCES = ["quicknode", "coingecko"] as const;

  /**
   * Get BTC price with Redis caching and comprehensive fallback
   */
  static async getPrice(preferredSource?: string): Promise<BTCPriceData> {
    const startTime = Date.now();

    try {
      console.log(`[BTCPriceService] Starting BTC price fetch with Redis caching, preferredSource: ${preferredSource}`);

      // Use Redis cache with fallback chain
      const priceData = await dbManager.handleCache<BTCPriceData>(
        this.CACHE_KEY,
        () => this.fetchFreshPriceData(preferredSource),
        this.CACHE_CONFIG.duration,
      );

      const duration = Date.now() - startTime;
      console.log(`[BTCPriceService] BTC price retrieved successfully: $${priceData.price} from ${priceData.source} (${duration}ms)`);

      return priceData;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[BTCPriceService] Critical error in BTC price retrieval (${duration}ms):`, error);

      // Emergency fallback to static default
      return this.getStaticFallbackPrice();
    }
  }

  /**
   * Fetch fresh price data from external sources with fallback chain
   */
  private static async fetchFreshPriceData(preferredSource?: string): Promise<BTCPriceData> {
    const errors: string[] = [];

    console.log(`[BTCPriceService] Fetching fresh BTC price from external sources, preferredSource: ${preferredSource}`);

    // Determine source order
    const sources = preferredSource 
      ? [preferredSource, ...this.SOURCES.filter(s => s !== preferredSource)]
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
        console.warn(`[BTCPriceService] BTC price source (${source}) failed: ${errorMessage}`);
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
    const primaryIndex = this.sourceCounter % this.SOURCES.length;
    this.sourceCounter = (this.sourceCounter + 1) % Number.MAX_SAFE_INTEGER;
    
    const primary = this.SOURCES[primaryIndex];
    const secondary = this.SOURCES.find(s => s !== primary)!;
    
    return [primary, secondary];
  }

  /**
   * Fetch price from specific source
   */
  private static async fetchFromSource(source: string): Promise<Omit<BTCPriceData, 'timestamp' | 'fallbackUsed' | 'errors'> | null> {
    switch (source) {
      case "quicknode":
        return await this.fetchFromQuickNode();
      case "coingecko":
        return await this.fetchFromCoinGecko();
      default:
        throw new Error(`Unknown price source: ${source}`);
    }
  }

  /**
   * Fetch from QuickNode
   */
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

  /**
   * Fetch from CoinGecko
   */
  private static async fetchFromCoinGecko(): Promise<Omit<BTCPriceData, 'timestamp' | 'fallbackUsed' | 'errors'> | null> {
    try {
      const response = await fetch(
        `${COINGECKO_API_BASE_URL}/simple/price?ids=bitcoin&vs_currencies=usd`
      );
      
      if (!response.ok) {
        console.error(`[BTCPriceService] CoinGecko API error: ${response.status} ${response.statusText}`);
        throw new Error(`CoinGecko API returned ${response.status}`);
      }
      
      const data = await response.json();
      const price = data.bitcoin.usd;
      console.log(`[BTCPriceService] CoinGecko price result: $${price}`);
      
      return {
        price,
        source: "coingecko",
        confidence: "high",
        details: data,
      };
    } catch (error) {
      console.error("[BTCPriceService] CoinGecko price fetch failed:", error);
      throw error;
    }
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
  static async invalidateCache(): Promise<void> {
    try {
      await dbManager.invalidateCache(this.CACHE_KEY);
      console.log("[BTCPriceService] BTC price cache invalidated");
    } catch (error) {
      console.error("[BTCPriceService] Failed to invalidate BTC price cache:", error);
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
}

