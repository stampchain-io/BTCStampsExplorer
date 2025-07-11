/**
 * Price Service Interface for Dependency Injection
 * Abstracts price data operations for better testability
 */

export interface PriceData {
  price: number;
  source: string;
  timestamp: number;
  confidence: "high" | "medium" | "low";
}

export interface PriceProvider {
  /**
   * Get the current BTC price from this provider
   */
  getPrice(): Promise<PriceData>;

  /**
   * Get the name of this price provider
   */
  getName(): string;

  /**
   * Check if this provider is currently available
   */
  isAvailable(): Promise<boolean>;
}

export interface PriceService {
  /**
   * Get the current BTC price with fallback logic
   */
  getPrice(): Promise<PriceData>;

  /**
   * Add a price provider to the service
   */
  addProvider(provider: PriceProvider): void;

  /**
   * Remove a price provider from the service
   */
  removeProvider(providerName: string): void;

  /**
   * Get list of all providers
   */
  getProviders(): PriceProvider[];

  /**
   * Get health status of all providers
   */
  getProviderHealth(): Promise<Array<{
    name: string;
    available: boolean;
    lastPrice?: PriceData;
  }>>;
}

/**
 * Mock price provider for testing
 */
export class MockPriceProvider implements PriceProvider {
  constructor(
    private name: string,
    private mockPrice: number = 50000,
    private shouldFail: boolean = false,
    private confidence: "high" | "medium" | "low" = "high"
  ) {}

  async getPrice(): Promise<PriceData> {
    if (this.shouldFail) {
      throw new Error(`Mock provider ${this.name} is configured to fail`);
    }

    await Promise.resolve(); // Simulate async operation
    return {
      price: this.mockPrice,
      source: this.name,
      timestamp: Date.now(),
      confidence: this.confidence,
    };
  }

  getName(): string {
    return this.name;
  }

  async isAvailable(): Promise<boolean> {
    await Promise.resolve(); // Simulate async check
    return !this.shouldFail;
  }

  // Test helpers
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

/**
 * HTTP-based price provider
 */
export abstract class HttpPriceProvider implements PriceProvider {
  constructor(
    protected httpClient: any,
    protected name: string,
    protected apiUrl: string
  ) {}

  abstract getPrice(): Promise<PriceData>;

  getName(): string {
    return this.name;
  }

  async isAvailable(): Promise<boolean> {
    try {
      await this.httpClient.get(this.apiUrl, { timeout: 5000 });
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * CoinGecko price provider implementation
 */
export class CoinGeckoPriceProvider extends HttpPriceProvider {
  constructor(httpClient: any) {
    super(
      httpClient,
      "coingecko",
      "https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd"
    );
  }

  async getPrice(): Promise<PriceData> {
    try {
      const response = await this.httpClient.get(this.apiUrl);
      const price = response.data?.bitcoin?.usd;
      
      if (typeof price !== "number") {
        throw new Error("Invalid price data from CoinGecko");
      }

      return {
        price,
        source: this.name,
        timestamp: Date.now(),
        confidence: "high",
      };
    } catch (error) {
      throw new Error(`CoinGecko API error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * Binance price provider implementation
 */
export class BinancePriceProvider extends HttpPriceProvider {
  constructor(httpClient: any) {
    super(
      httpClient,
      "binance",
      "https://api.binance.com/api/v3/ticker/price?symbol=BTCUSDT"
    );
  }

  async getPrice(): Promise<PriceData> {
    try {
      const response = await this.httpClient.get(this.apiUrl);
      const price = parseFloat(response.data?.price);
      
      if (isNaN(price)) {
        throw new Error("Invalid price data from Binance");
      }

      return {
        price,
        source: this.name,
        timestamp: Date.now(),
        confidence: "high",
      };
    } catch (error) {
      throw new Error(`Binance API error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}