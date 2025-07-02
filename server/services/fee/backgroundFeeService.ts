import { FeeService } from "$server/services/fee/feeService.ts";
import { BTCPriceService } from "$server/services/price/btcPriceService.ts";
import { logger } from "$lib/utils/logger.ts";

export class BackgroundFeeService {
  private static intervalId: number | null = null;
  private static priceIntervalId: number | null = null;
  private static isRunning = false;
  private static readonly CACHE_WARM_INTERVAL = 60000; // 60 seconds
  private static readonly PRICE_WARM_INTERVAL = 60000; // 60 seconds (can be different)
  private static readonly MAX_RETRIES = 3;
  private static retryCount = 0;
  private static priceRetryCount = 0;

  /**
   * Start the background services (fees + BTC price)
   */
  static start(baseUrl: string): void {
    if (this.isRunning) {
      logger.warn("stamps", {
        message: "Background services already running",
      });
      return;
    }

    logger.info("stamps", {
      message: "Starting background cache warming services",
      feeInterval: this.CACHE_WARM_INTERVAL,
      priceInterval: this.PRICE_WARM_INTERVAL,
      baseUrl,
    });

    this.isRunning = true;

    // Initial cache warming
    this.warmFeeCache(baseUrl);
    this.warmPriceCache();

    // Set up intervals for regular cache warming
    this.intervalId = setInterval(() => {
      this.warmFeeCache(baseUrl);
    }, this.CACHE_WARM_INTERVAL);

    this.priceIntervalId = setInterval(() => {
      this.warmPriceCache();
    }, this.PRICE_WARM_INTERVAL);

    logger.info("stamps", {
      message: "Background services started successfully",
    });
  }

  /**
   * Stop the background services
   */
  static stop(): void {
    if (!this.isRunning) {
      logger.warn("stamps", {
        message: "Background services not running",
      });
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.priceIntervalId) {
      clearInterval(this.priceIntervalId);
      this.priceIntervalId = null;
    }

    this.isRunning = false;
    this.retryCount = 0;
    this.priceRetryCount = 0;

    logger.info("stamps", {
      message: "Background services stopped",
    });
  }

  /**
   * Warm the fee cache by fetching fresh data
   */
  private static async warmFeeCache(baseUrl: string): Promise<void> {
    const startTime = Date.now();

    try {
      logger.debug("stamps", {
        message: "Starting background fee cache warming",
        attempt: this.retryCount + 1,
      });

      // Invalidate current cache to force fresh fetch
      await FeeService.invalidateCache();

      // Fetch fresh fee data (this will populate the cache)
      const feeData = await FeeService.getFeeData(baseUrl);

      const duration = Date.now() - startTime;
      this.retryCount = 0; // Reset retry count on success

      logger.info("stamps", {
        message: "Background fee cache warmed successfully",
        source: feeData.source,
        recommendedFee: feeData.recommendedFee,
        duration,
        fallbackUsed: feeData.fallbackUsed,
      });

      console.log(
        `[Background] Fee cache warmed: ${feeData.recommendedFee} sats/vB from ${feeData.source} (${duration}ms)`,
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      this.retryCount++;

      const errorMessage = error instanceof Error ? error.message : String(error);

      logger.error("stamps", {
        message: "Background fee cache warming failed",
        error: errorMessage,
        duration,
        attempt: this.retryCount,
        maxRetries: this.MAX_RETRIES,
      });

      console.error(
        `[Background] Fee cache warming failed (attempt ${this.retryCount}/${this.MAX_RETRIES}):`,
        errorMessage,
      );

      // If we've exceeded max retries, wait longer before next attempt
      if (this.retryCount >= this.MAX_RETRIES) {
        logger.warn("stamps", {
          message: "Max retries exceeded for background fee warming, will retry on next interval",
        });
        this.retryCount = 0; // Reset for next interval
      }
    }
  }

  /**
   * Warm the BTC price cache by fetching fresh data
   */
  private static async warmPriceCache(): Promise<void> {
    const startTime = Date.now();

    try {
      logger.debug("stamps", {
        message: "Starting background BTC price cache warming",
        attempt: this.priceRetryCount + 1,
      });

      // Invalidate current cache to force fresh fetch
      await BTCPriceService.invalidateCache();

      // Fetch fresh price data (this will populate the cache)
      const priceData = await BTCPriceService.getPrice();

      const duration = Date.now() - startTime;
      this.priceRetryCount = 0; // Reset retry count on success

      logger.info("stamps", {
        message: "Background BTC price cache warmed successfully",
        source: priceData.source,
        price: priceData.price,
        duration,
        fallbackUsed: priceData.fallbackUsed,
      });

      console.log(
        `[Background] BTC price cache warmed: $${priceData.price} from ${priceData.source} (${duration}ms)`,
      );
    } catch (error) {
      const duration = Date.now() - startTime;
      this.priceRetryCount++;

      const errorMessage = error instanceof Error ? error.message : String(error);

      logger.error("stamps", {
        message: "Background BTC price cache warming failed",
        error: errorMessage,
        duration,
        attempt: this.priceRetryCount,
        maxRetries: this.MAX_RETRIES,
      });

      console.error(
        `[Background] BTC price cache warming failed (attempt ${this.priceRetryCount}/${this.MAX_RETRIES}):`,
        errorMessage,
      );

      // If we've exceeded max retries, wait longer before next attempt
      if (this.priceRetryCount >= this.MAX_RETRIES) {
        logger.warn("stamps", {
          message: "Max retries exceeded for background BTC price warming, will retry on next interval",
        });
        this.priceRetryCount = 0; // Reset for next interval
      }
    }
  }

  /**
   * Get the current status of the background services
   */
  static getStatus(): {
    isRunning: boolean;
    intervalId: number | null;
    priceIntervalId: number | null;
    retryCount: number;
    priceRetryCount: number;
    feeCacheInfo: ReturnType<typeof FeeService.getCacheInfo>;
    priceCacheInfo: ReturnType<typeof BTCPriceService.getCacheInfo>;
  } {
    return {
      isRunning: this.isRunning,
      intervalId: this.intervalId,
      priceIntervalId: this.priceIntervalId,
      retryCount: this.retryCount,
      priceRetryCount: this.priceRetryCount,
      feeCacheInfo: FeeService.getCacheInfo(),
      priceCacheInfo: BTCPriceService.getCacheInfo(),
    };
  }

  /**
   * Force immediate cache warming (useful for testing or manual refresh)
   */
  static async forceWarm(baseUrl: string): Promise<void> {
    logger.info("stamps", {
      message: "Forcing immediate cache warming for fees and BTC price",
    });

    await Promise.all([
      this.warmFeeCache(baseUrl),
      this.warmPriceCache(),
    ]);
  }

  /**
   * Force immediate BTC price cache warming only
   */
  static async forceWarmPrice(): Promise<void> {
    logger.info("stamps", {
      message: "Forcing immediate BTC price cache warming",
    });

    await this.warmPriceCache();
  }

  /**
   * Force an immediate fee cache warm (useful for testing or manual refresh)
   * @deprecated Use forceWarm() for both services or forceWarmPrice() for price only
   */
  static async forceWarmFee(baseUrl: string): Promise<void> {
    logger.info("stamps", {
      message: "Forcing immediate fee cache warm",
    });

    await this.warmFeeCache(baseUrl);
  }

  /**
   * Check if the service is running
   */
  static get running(): boolean {
    return this.isRunning;
  }
} 