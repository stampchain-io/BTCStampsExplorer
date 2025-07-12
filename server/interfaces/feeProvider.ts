/**
 * Fee Provider Interface for Dependency Injection
 * Abstracts fee estimation operations for better testability
 */

export interface FeeEstimate {
  recommendedFee: number;
  fastestFee?: number;
  halfHourFee?: number;
  hourFee?: number;
  economyFee?: number;
  minimumFee?: number;
  confidence: "high" | "medium" | "low";
  source: string;
  timestamp: number;
  debug_feesResponse?: any;
}

export interface FeeProvider {
  /**
   * Get fee estimates from this provider
   */
  getFeeEstimate(): Promise<FeeEstimate>;

  /**
   * Get the name of this fee provider
   */
  getName(): string;

  /**
   * Check if this provider is currently available
   */
  isAvailable(): Promise<boolean>;

  /**
   * Get the confidence level of this provider
   */
  getConfidenceLevel(): "high" | "medium" | "low";
}

export interface FeeService {
  /**
   * Get fee estimates with fallback logic
   */
  getFeeEstimate(): Promise<FeeEstimate>;

  /**
   * Add a fee provider to the service
   */
  addProvider(provider: FeeProvider): void;

  /**
   * Remove a fee provider from the service
   */
  removeProvider(providerName: string): void;

  /**
   * Get list of all providers
   */
  getProviders(): FeeProvider[];

  /**
   * Get health status of all providers
   */
  getProviderHealth(): Promise<Array<{
    name: string;
    available: boolean;
    lastEstimate?: FeeEstimate;
  }>>;
}

/**
 * Mock fee provider for testing
 */
export class MockFeeProvider implements FeeProvider {
  constructor(
    private name: string,
    private mockFees: Partial<FeeEstimate> = {},
    private shouldFail: boolean = false,
    private confidence: "high" | "medium" | "low" = "high"
  ) {}

  async getFeeEstimate(): Promise<FeeEstimate> {
    if (this.shouldFail) {
      throw new Error(`Mock provider ${this.name} is configured to fail`);
    }

    await Promise.resolve(); // Simulate async operation
    
    return {
      recommendedFee: 10,
      fastestFee: 15,
      halfHourFee: 12,
      hourFee: 8,
      economyFee: 5,
      minimumFee: 1,
      confidence: this.confidence,
      source: this.name,
      timestamp: Date.now(),
      debug_feesResponse: { mock: true },
      ...this.mockFees,
    };
  }

  getName(): string {
    return this.name;
  }

  async isAvailable(): Promise<boolean> {
    await Promise.resolve(); // Simulate async check
    return !this.shouldFail;
  }

  getConfidenceLevel(): "high" | "medium" | "low" {
    return this.confidence;
  }

  // Test helpers
  setFees(fees: Partial<FeeEstimate>): void {
    this.mockFees = { ...this.mockFees, ...fees };
  }

  setShouldFail(shouldFail: boolean): void {
    this.shouldFail = shouldFail;
  }

  setConfidence(confidence: "high" | "medium" | "low"): void {
    this.confidence = confidence;
  }
}

/**
 * HTTP-based fee provider base class
 */
export abstract class HttpFeeProvider implements FeeProvider {
  constructor(
    protected httpClient: any,
    protected name: string,
    protected apiUrl: string,
    protected confidence: "high" | "medium" | "low" = "medium"
  ) {}

  abstract getFeeEstimate(): Promise<FeeEstimate>;

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

  getConfidenceLevel(): "high" | "medium" | "low" {
    return this.confidence;
  }
}

/**
 * Mempool.space fee provider implementation
 */
export class MempoolFeeProvider extends HttpFeeProvider {
  constructor(httpClient: any) {
    super(
      httpClient,
      "mempool",
      "https://mempool.space/api/v1/fees/recommended",
      "high"
    );
  }

  async getFeeEstimate(): Promise<FeeEstimate> {
    try {
      const response = await this.httpClient.get(this.apiUrl);
      const data = response.data;
      
      if (!data || typeof data !== "object") {
        throw new Error("Invalid fee data from mempool.space");
      }

      // Validate and extract fee data
      const fastestFee = typeof data.fastestFee === "number" ? data.fastestFee : undefined;
      const halfHourFee = typeof data.halfHourFee === "number" ? data.halfHourFee : undefined;
      const hourFee = typeof data.hourFee === "number" ? data.hourFee : undefined;
      const economyFee = typeof data.economyFee === "number" ? data.economyFee : undefined;
      const minimumFee = typeof data.minimumFee === "number" ? data.minimumFee : undefined;

      // Determine recommended fee (prefer fastestFee, fallback to halfHourFee)
      let recommendedFee = 6; // Default fallback
      if (fastestFee && fastestFee >= 1) {
        recommendedFee = fastestFee;
      } else if (halfHourFee && halfHourFee >= 1) {
        recommendedFee = halfHourFee;
      }

      return {
        recommendedFee,
        fastestFee,
        halfHourFee,
        hourFee,
        economyFee,
        minimumFee,
        confidence: this.confidence,
        source: this.name,
        timestamp: Date.now(),
        debug_feesResponse: data,
      };
    } catch (error) {
      throw new Error(`Mempool.space API error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

/**
 * QuickNode fee provider implementation
 */
export class QuickNodeFeeProvider extends HttpFeeProvider {
  constructor(
    httpClient: any,
    private quicknodeService: any
  ) {
    super(
      httpClient,
      "quicknode",
      "", // URL handled by quicknodeService
      "medium"
    );
  }

  async getFeeEstimate(): Promise<FeeEstimate> {
    try {
      const feeEstimate = await this.quicknodeService.estimateSmartFee(6, "economical");
      
      if (!feeEstimate || typeof feeEstimate.feeRateSatsPerVB !== "number") {
        throw new Error("Invalid fee estimate from QuickNode");
      }

      return {
        recommendedFee: feeEstimate.feeRateSatsPerVB,
        confidence: feeEstimate.confidence === "high" ? "high" : "medium",
        source: this.name,
        timestamp: Date.now(),
        debug_feesResponse: {
          quicknode_estimate: feeEstimate,
          blocks: feeEstimate.blocks,
          confidence: feeEstimate.confidence,
        },
      };
    } catch (error) {
      throw new Error(`QuickNode API error: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  // Override isAvailable to use quicknodeService
  override async isAvailable(): Promise<boolean> {
    try {
      await this.quicknodeService.estimateSmartFee(6, "economical");
      return true;
    } catch {
      return false;
    }
  }
}

/**
 * Static fallback fee provider (always works)
 */
export class StaticFeeProvider implements FeeProvider {
  private static readonly STATIC_RATES = {
    conservative: 10,
    normal: 6,
    minimum: 1,
  };

  constructor(private name: string = "static") {}

  async getFeeEstimate(): Promise<FeeEstimate> {
    await Promise.resolve(); // Simulate async operation
    
    return {
      recommendedFee: StaticFeeProvider.STATIC_RATES.conservative,
      fastestFee: StaticFeeProvider.STATIC_RATES.conservative,
      halfHourFee: StaticFeeProvider.STATIC_RATES.normal,
      hourFee: StaticFeeProvider.STATIC_RATES.normal,
      economyFee: StaticFeeProvider.STATIC_RATES.minimum,
      minimumFee: StaticFeeProvider.STATIC_RATES.minimum,
      confidence: "low",
      source: this.name,
      timestamp: Date.now(),
      debug_feesResponse: {
        static_fallback: true,
        available_rates: StaticFeeProvider.STATIC_RATES,
        selected_rate: StaticFeeProvider.STATIC_RATES.conservative,
        reason: "Static fallback provider",
      },
    };
  }

  getName(): string {
    return this.name;
  }

  async isAvailable(): Promise<boolean> {
    await Promise.resolve();
    return true; // Static provider is always available
  }

  getConfidenceLevel(): "high" | "medium" | "low" {
    return "low";
  }
}