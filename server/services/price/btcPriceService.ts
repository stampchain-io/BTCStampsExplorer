import { CachedQuicknodeRPCService } from "$server/services/quicknode/cachedQuicknodeRpcService.ts";
import { dbManager } from "$server/database/databaseManager.ts";
import { RouteType, getCacheConfig } from "$server/services/cacheService.ts";
import { COINGECKO_API_BASE_URL } from "$lib/utils/constants.ts";

export interface BTCPriceData {
  price: number;
  source: "quicknode" | "coingecko" | "binance" | "cached" | "default";
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
  
  // Updated sources array - QuickNode disabled (no longer subscribed to cg_simplePrice addon)
  // Binance added as free alternative API for price fetching
  private static readonly SOURCES = ["coingecko", "binance"] as const;
  // To re-enable QuickNode when subscription is restored: ["quicknode", "coingecko", "binance"]

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
      // QuickNode disabled - no longer subscribed to cg_simplePrice addon
      // case "quicknode":
      //   return await this.fetchFromQuickNode();
      case "coingecko":
        return await this.fetchFromCoinGecko();
      case "binance":
        return await this.fetchFromBinance();
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
   * Fetch from Binance (Free API - no authentication required)
   */
  private static async fetchFromBinance(): Promise<Omit<BTCPriceData, 'timestamp' | 'fallbackUsed' | 'errors'> | null> {
    try {
      const response = await fetch(
        "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT"
      );
      
      if (!response.ok) {
        console.error(`[BTCPriceService] Binance API error: ${response.status} ${response.statusText}`);
        throw new Error(`Binance API returned ${response.status}`);
      }
      
      const data = await response.json();
      const price = parseFloat(data.price);
      console.log(`[BTCPriceService] Binance price result: $${price}`);
      
      return {
        price,
        source: "binance",
        confidence: "high",
        details: data,
      };
    } catch (error) {
      console.error("[BTCPriceService] Binance price fetch failed:", error);
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
  static invalidateCache(): Promise<void> {
    try {
      return dbManager.invalidateCache(this.CACHE_KEY)
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
}

