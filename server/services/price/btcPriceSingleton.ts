import { BTCPriceData, BTCPriceService } from "./btcPriceService.ts";

/**
 * Global singleton for BTC price caching
 * This ensures only one BTC price fetch happens across all requests within the cache window
 */
class BTCPriceSingleton {
  private static instance: BTCPriceSingleton;
  private cachedPrice: BTCPriceData | null = null;
  private lastFetchTime = 0;
  private readonly CACHE_DURATION = 30000; // 30 seconds
  private fetchPromise: Promise<BTCPriceData> | null = null;

  private constructor() {}

  public static getInstance(): BTCPriceSingleton {
    if (!BTCPriceSingleton.instance) {
      BTCPriceSingleton.instance = new BTCPriceSingleton();
    }
    return BTCPriceSingleton.instance;
  }

  /**
   * Get BTC price with guaranteed singleton caching
   * Multiple concurrent requests will share the same fetch promise
   */
  public async getPrice(preferredSource?: string): Promise<BTCPriceData> {
    const now = Date.now();

    // Return cached price if still valid
    if (this.cachedPrice && (now - this.lastFetchTime) < this.CACHE_DURATION) {
      console.log(`[BTCPriceSingleton] Cache HIT: $${this.cachedPrice.price} from ${this.cachedPrice.source} (age: ${now - this.lastFetchTime}ms)`);
      return {
        ...this.cachedPrice,
        source: "cached"
      };
    }

    // If already fetching, return the same promise (prevents duplicate requests)
    if (this.fetchPromise) {
      console.log(`[BTCPriceSingleton] Concurrent request detected, sharing fetch promise`);
      return await this.fetchPromise;
    }

    // Start new fetch
    console.log(`[BTCPriceSingleton] Cache MISS: Fetching fresh price (last fetch: ${now - this.lastFetchTime}ms ago)`);

    this.fetchPromise = this.fetchFreshPrice(preferredSource);

    try {
      const freshPrice = await this.fetchPromise;

      // Cache the result
      this.cachedPrice = freshPrice;
      this.lastFetchTime = now;

      console.log(`[BTCPriceSingleton] Fresh price cached: $${freshPrice.price} from ${freshPrice.source}`);

      return freshPrice;
    } finally {
      // Clear the promise so new requests can start
      this.fetchPromise = null;
    }
  }

  private async fetchFreshPrice(preferredSource?: string): Promise<BTCPriceData> {
    try {
      return await BTCPriceService.getPrice(preferredSource);
    } catch (error) {
      console.error(`[BTCPriceSingleton] Fetch failed:`, error);

      // Return cached price if available, even if stale
      if (this.cachedPrice) {
        console.log(`[BTCPriceSingleton] Using stale cached price due to fetch error`);
        return {
          ...this.cachedPrice,
          source: "cached",
          fallbackUsed: true
        };
      }

      throw error;
    }
  }

  /**
   * Get cache status for debugging
   */
  public getCacheStatus(): {
    hasCachedPrice: boolean;
    age: number;
    isValid: boolean;
    price?: number;
    source?: string;
  } {
    const now = Date.now();
    const age = now - this.lastFetchTime;
    const isValid = this.cachedPrice !== null && age < this.CACHE_DURATION;

    const result: {
      hasCachedPrice: boolean;
      age: number;
      isValid: boolean;
      price?: number;
      source?: string;
    } = {
      hasCachedPrice: this.cachedPrice !== null,
      age,
      isValid
    };

    if (this.cachedPrice?.price !== undefined) {
      result.price = this.cachedPrice.price;
    }
    if (this.cachedPrice?.source !== undefined) {
      result.source = this.cachedPrice.source;
    }

    return result;
  }
}

// Export singleton instance
export const btcPriceSingleton = BTCPriceSingleton.getInstance();
