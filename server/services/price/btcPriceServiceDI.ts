/**
 * @fileoverview Dependency-Injected BTCPriceService with abstracted dependencies
 * Enables better testing, flexibility, and maintainability
 */

import type { CacheService } from "$server/interfaces/cacheService.ts";
import type { HttpClient } from "$server/interfaces/httpClient.ts";

// Core types and interfaces
export interface BTCPriceData {
  price: number;
  source: "coingecko" | "binance" | "quicknode" | "cached" | "default";
  confidence: "high" | "medium" | "low";
  timestamp: number;
  details?: any;
  fallbackUsed?: boolean;
  errors?: string[];
}

export interface PriceProvider {
  getName(): string;
  getPrice(): Promise<{
    price: number;
    confidence: "high" | "medium" | "low";
    details?: any;
  }>;
}

export interface PriceServiceDependencies {
  cacheService: CacheService;
  httpClient: HttpClient;
  priceProviders: PriceProvider[];
}

export interface PriceServiceConfig {
  cacheKey: string;
  cacheDuration: number;
  staticFallbackPrice: number;
  providerRotation: boolean;
  maxRetries: number;
  retryDelay: number;
}

// Default configuration
const DEFAULT_CONFIG: PriceServiceConfig = {
  cacheKey: "btc_price_data_di",
  cacheDuration: 300, // 5 minutes
  staticFallbackPrice: 0,
  providerRotation: true,
  maxRetries: 3,
  retryDelay: 1000,
};

export class BTCPriceServiceDI {
  private config: PriceServiceConfig;
  private sourceCounter = 0;

  constructor(
    private dependencies: PriceServiceDependencies,
    config?: Partial<PriceServiceConfig>
  ) {
    this.config = { ...DEFAULT_CONFIG, ...config };
  }

  /**
   * Get BTC price with caching and comprehensive fallback
   */
  async getPrice(preferredSource?: string): Promise<BTCPriceData> {
    const startTime = Date.now();

    try {
      console.log(`[BTCPriceServiceDI] Starting BTC price fetch, preferredSource: ${preferredSource}`);

      // Use cache service with fallback chain
      const priceData = await this.dependencies.cacheService.get(
        this.config.cacheKey,
        () => this.fetchFreshPriceData(preferredSource),
        { 
          duration: this.config.cacheDuration,
          staleWhileRevalidate: 300, // 5 minutes
          staleIfError: 3600 // 1 hour
        }
      );

      const duration = Date.now() - startTime;
      console.log(`[BTCPriceServiceDI] BTC price retrieved: $${priceData.price} from ${priceData.source} (${duration}ms)`);

      return priceData;
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`[BTCPriceServiceDI] Critical error in price retrieval (${duration}ms):`, error);

      // Emergency fallback to static default
      return this.getStaticFallbackPrice();
    }
  }

  /**
   * Fetch fresh price data from providers with fallback chain
   */
  private async fetchFreshPriceData(preferredSource?: string): Promise<BTCPriceData> {
    const errors: string[] = [];
    const providers = this.getProviderOrder(preferredSource);

    console.log(`[BTCPriceServiceDI] Provider order: ${providers.map(p => p.getName()).join(' → ')}`);

    // Try each provider in order
    for (let i = 0; i < providers.length; i++) {
      const provider = providers[i];
      try {
        console.log(`[BTCPriceServiceDI] Attempting ${provider.getName()}...`);
        const result = await this.fetchFromProvider(provider);
        
        if (result) {
          console.log(`[BTCPriceServiceDI] Provider ${provider.getName()} successful: $${result.price}`);

          return {
            ...result,
            source: provider.getName() as BTCPriceData["source"],
            timestamp: Date.now(),
            fallbackUsed: i > 0,
            ...(errors.length > 0 && { errors }),
          };
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(`${provider.getName()}: ${errorMessage}`);
        
        const isRateLimitError = errorMessage.includes('429') || errorMessage.includes('rate limit');
        if (isRateLimitError) {
          console.log(`[BTCPriceServiceDI] ${provider.getName()} rate limited, trying next provider...`);
        } else {
          console.warn(`[BTCPriceServiceDI] ${provider.getName()} failed: ${errorMessage}`);
        }
      }
    }

    // All providers failed
    console.warn(`[BTCPriceServiceDI] All price providers failed, using static fallback. Errors:`, errors);

    return {
      ...this.getStaticFallbackPrice(),
      errors,
    };
  }

  /**
   * Get provider order based on configuration and preference
   */
  private getProviderOrder(preferredSource?: string): PriceProvider[] {
    const providers = [...this.dependencies.priceProviders];

    if (preferredSource) {
      // Move preferred provider to front
      const preferredProvider = providers.find(p => p.getName() === preferredSource);
      if (preferredProvider) {
        const otherProviders = providers.filter(p => p.getName() !== preferredSource);
        return [preferredProvider, ...otherProviders];
      }
    }

    if (this.config.providerRotation && providers.length > 1) {
      // Round-robin rotation
      const primaryIndex = this.sourceCounter % providers.length;
      this.sourceCounter = (this.sourceCounter + 1) % Number.MAX_SAFE_INTEGER;
      
      const primary = providers[primaryIndex];
      const others = providers.filter((_, index) => index !== primaryIndex);
      return [primary, ...others];
    }

    return providers;
  }

  /**
   * Fetch price from specific provider with retry logic
   */
  private async fetchFromProvider(provider: PriceProvider): Promise<{
    price: number;
    confidence: "high" | "medium" | "low";
    details?: any;
  } | null> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= this.config.maxRetries; attempt++) {
      try {
        const result = await provider.getPrice();
        
        // Validate result
        if (typeof result.price !== 'number' || result.price <= 0) {
          throw new Error(`Invalid price received: ${result.price}`);
        }

        return result;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        
        if (attempt < this.config.maxRetries) {
          console.log(`[BTCPriceServiceDI] ${provider.getName()} attempt ${attempt} failed, retrying...`);
          await this.delay(this.config.retryDelay);
        }
      }
    }

    if (lastError) {
      throw lastError;
    }

    return null;
  }

  /**
   * Get static fallback price data
   */
  private getStaticFallbackPrice(): BTCPriceData {
    return {
      price: this.config.staticFallbackPrice,
      source: "default",
      confidence: "low",
      timestamp: Date.now(),
      fallbackUsed: true,
      details: {
        static_fallback: true,
        reason: "All price providers failed",
        fallbackPrice: this.config.staticFallbackPrice,
      },
    };
  }

  /**
   * Invalidate price cache
   */
  async invalidateCache(): Promise<void> {
    try {
      await this.dependencies.cacheService.delete(this.config.cacheKey);
      console.log("[BTCPriceServiceDI] Price cache invalidated");
    } catch (error) {
      console.error("[BTCPriceServiceDI] Failed to invalidate cache:", error);
    }
  }

  /**
   * Get cache and configuration information
   */
  getCacheInfo(): {
    cacheKey: string;
    cacheDuration: number;
  } {
    return {
      cacheKey: this.config.cacheKey,
      cacheDuration: this.config.cacheDuration,
    };
  }

  /**
   * Get current configuration
   */
  getConfig(): PriceServiceConfig {
    return { ...this.config };
  }

  /**
   * Get available providers
   */
  getProviders(): string[] {
    return this.dependencies.priceProviders.map(p => p.getName());
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

// Concrete provider implementations

export class CoinGeckoPriceProvider implements PriceProvider {
  constructor(
    private httpClient: HttpClient,
    private apiBaseUrl: string = "https://api.coingecko.com/api/v3"
  ) {}

  getName(): string {
    return "coingecko";
  }

  async getPrice(): Promise<{
    price: number;
    confidence: "high" | "medium" | "low";
    details?: any;
  }> {
    const response = await this.httpClient.get(
      `${this.apiBaseUrl}/simple/price?ids=bitcoin&vs_currencies=usd`,
      { timeout: 10000 }
    );

    if (!response.ok || response.status >= 400) {
      throw new Error(`CoinGecko API error: ${response.status}`);
    }

    const data = response.data;
    if (!data?.bitcoin?.usd) {
      throw new Error("Invalid CoinGecko response structure");
    }

    return {
      price: data.bitcoin.usd,
      confidence: "high",
      details: data,
    };
  }
}

export class BinancePriceProvider implements PriceProvider {
  constructor(
    private httpClient: HttpClient,
    private apiBaseUrl: string = "https://api.binance.com/api/v3"
  ) {}

  getName(): string {
    return "binance";
  }

  async getPrice(): Promise<{
    price: number;
    confidence: "high" | "medium" | "low";
    details?: any;
  }> {
    const response = await this.httpClient.get(
      `${this.apiBaseUrl}/ticker/price?symbol=BTCUSDT`,
      { timeout: 10000 }
    );

    if (!response.ok || response.status >= 400) {
      throw new Error(`Binance API error: ${response.status}`);
    }

    const data = response.data;
    if (!data?.price) {
      throw new Error("Invalid Binance response structure");
    }

    const price = parseFloat(data.price);
    if (isNaN(price) || price <= 0) {
      throw new Error(`Invalid price from Binance: ${data.price}`);
    }

    return {
      price,
      confidence: "high",
      details: data,
    };
  }
}

export class MockPriceProvider implements PriceProvider {
  constructor(
    private name: string,
    private mockPrice: number = 50000,
    private confidence: "high" | "medium" | "low" = "medium",
    private shouldFail: boolean = false
  ) {}

  getName(): string {
    return this.name;
  }

  async getPrice(): Promise<{
    price: number;
    confidence: "high" | "medium" | "low";
    details?: any;
  }> {
    if (this.shouldFail) {
      throw new Error(`Mock provider ${this.name} configured to fail`);
    }

    await new Promise(resolve => setTimeout(resolve, 10)); // Simulate network delay

    return {
      price: this.mockPrice,
      confidence: this.confidence,
      details: {
        mock: true,
        provider: this.name,
        timestamp: Date.now(),
      },
    };
  }

  // Helper methods for testing
  setPrice(price: number): void {
    this.mockPrice = price;
  }

  setShouldFail(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
  }

  setConfidence(confidence: "high" | "medium" | "low"): void {
    this.confidence = confidence;
  }
}