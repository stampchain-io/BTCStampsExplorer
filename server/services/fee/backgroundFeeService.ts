import { logger } from "$lib/utils/monitoring/logging/logger.ts";
import { getProductionFeeService } from "$server/services/fee/feeServiceFactory.ts";
import { BTCPriceService } from "$server/services/price/btcPriceService.ts";

export class BackgroundFeeService {
  private static intervalId: number | null = null;
  private static priceIntervalId: number | null = null;
  private static isRunning = false;
  private static retryCount = 0;
  private static priceRetryCount = 0;
  private static readonly MAX_RETRIES = 3;
  private static readonly INTERVAL_MS = 30000; // 30 seconds
  private static readonly PRICE_INTERVAL_MS = 300000; // 5 minutes


  private static feeService = getProductionFeeService();

  /**
   * Start the background fee and BTC price warming service
   */
  static start(): void {
    if (this.isRunning) {
      logger.warn("stamps", {
        message: "Background fee service is already running",
      });
      return;
    }

    this.isRunning = true;
    logger.info("stamps", {
      message: "Starting background fee and price warming service",
      feeInterval: this.INTERVAL_MS,
      priceInterval: this.PRICE_INTERVAL_MS,
    });

    // Start fee warming immediately and then on interval
    this.warmFeeCache();
    this.intervalId = setInterval(() => {
      this.warmFeeCache();
    }, this.INTERVAL_MS);

    // Start BTC price warming immediately and then on interval
    this.warmPriceCache();
    this.priceIntervalId = setInterval(() => {
      this.warmPriceCache();
    }, this.PRICE_INTERVAL_MS);
  }

  /**
   * Stop the background service
   */
  static stop(): void {
    if (!this.isRunning) {
      logger.warn("stamps", {
        message: "Background fee service is not running",
      });
      return;
    }

    this.isRunning = false;

    if (this.intervalId !== null) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    if (this.priceIntervalId !== null) {
      clearInterval(this.priceIntervalId);
      this.priceIntervalId = null;
    }

    logger.info("stamps", {
      message: "Background fee and price warming service stopped",
    });
  }

  /**
   * Warm the fee cache by fetching fresh data
   */
  private static async warmFeeCache(): Promise<void> {
    const startTime = Date.now();

    try {
      logger.debug("stamps", {
        message: "Starting background fee cache warming",
        attempt: this.retryCount + 1,
      });

      // Note: DI version doesn't have invalidateCache method, but cache will be refreshed
      // when the cache TTL expires, so we just fetch fresh data

      // Fetch fresh fee data (this will populate the cache)
      const feeData = await this.feeService.getFeeData();

      const duration = Date.now() - startTime;
      this.retryCount = 0; // Reset retry count on success

      logger.info("stamps", {
        message: "Background fee cache warmed successfully",
        source: feeData.source,
        recommendedFee: feeData.recommendedFee,
        duration,
        fallbackUsed: feeData.fallbackUsed,
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      this.retryCount++;

      logger.error("stamps", {
        message: "Background fee cache warming failed",
        attempt: this.retryCount,
        maxRetries: this.MAX_RETRIES,
        duration,
        error: error instanceof Error ? error.message : String(error),
      });

      // If we've exceeded max retries, stop the service to prevent spam
      if (this.retryCount >= this.MAX_RETRIES) {
        logger.error("stamps", {
          message: "Max retries exceeded, stopping background fee service",
          retryCount: this.retryCount,
        });
        this.stop();
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

      // Fetch fresh BTC price data
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
    } catch (error) {
      const duration = Date.now() - startTime;
      this.priceRetryCount++;

      logger.error("stamps", {
        message: "Background BTC price cache warming failed",
        attempt: this.priceRetryCount,
        maxRetries: this.MAX_RETRIES,
        duration,
        error: error instanceof Error ? error.message : String(error),
      });

      // If we've exceeded max retries for price, just log but don't stop service
      // (fee warming might still be working)
      if (this.priceRetryCount >= this.MAX_RETRIES) {
        logger.warn("stamps", {
          message: "Max retries exceeded for BTC price warming",
          retryCount: this.priceRetryCount,
        });
        // Reset retry count to try again later
        this.priceRetryCount = 0;
      }
    }
  }

  /**
   * Get the current status of the background service
   */
  static getStatus(): {
    isRunning: boolean;
    intervalId: number | null;
    priceIntervalId: number | null;
    retryCount: number;
    priceRetryCount: number;
    feeCacheInfo: any;
    priceCacheInfo: any;
  } {
    return {
      isRunning: this.isRunning,
      intervalId: this.intervalId,
      priceIntervalId: this.priceIntervalId,
      retryCount: this.retryCount,
      priceRetryCount: this.priceRetryCount,
      feeCacheInfo: this.feeService.getCacheInfo(),
      priceCacheInfo: BTCPriceService.getCacheInfo(),
    };
  }

  /**
   * Force a manual cache warm (useful for testing)
   */
  static async forceWarm(): Promise<void> {
    logger.info("stamps", {
      message: "Forcing manual cache warm",
    });

    await Promise.all([
      this.warmFeeCache(),
      this.warmPriceCache(),
    ]);
  }

  /**
   * Force a manual BTC price cache warm
   */
  static async forceWarmPrice(): Promise<void> {
    logger.info("stamps", {
      message: "Forcing manual BTC price cache warm",
    });

    await this.warmPriceCache();
  }

  /**
   * Force a manual fee cache warm
   */
  static async forceWarmFee(): Promise<void> {
    logger.info("stamps", {
      message: "Forcing manual fee cache warm",
    });

    await this.warmFeeCache();
  }
}
