import { FeeService } from "$server/services/fee/feeService.ts";
import { logger } from "$lib/utils/logger.ts";

export class BackgroundFeeService {
  private static intervalId: number | null = null;
  private static isRunning = false;
  private static readonly CACHE_WARM_INTERVAL = 60000; // 60 seconds
  private static readonly MAX_RETRIES = 3;
  private static retryCount = 0;

  /**
   * Start the background fee cache warming service
   */
  static start(baseUrl: string): void {
    if (this.isRunning) {
      logger.warn("stamps", {
        message: "Background fee service already running",
      });
      return;
    }

    logger.info("stamps", {
      message: "Starting background fee cache warming service",
      interval: this.CACHE_WARM_INTERVAL,
      baseUrl,
    });

    this.isRunning = true;

    // Initial cache warm
    this.warmCache(baseUrl);

    // Set up interval for regular cache warming
    this.intervalId = setInterval(() => {
      this.warmCache(baseUrl);
    }, this.CACHE_WARM_INTERVAL);

    logger.info("stamps", {
      message: "Background fee service started successfully",
    });
  }

  /**
   * Stop the background fee cache warming service
   */
  static stop(): void {
    if (!this.isRunning) {
      logger.warn("stamps", {
        message: "Background fee service not running",
      });
      return;
    }

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
    this.retryCount = 0;

    logger.info("stamps", {
      message: "Background fee service stopped",
    });
  }

  /**
   * Warm the fee cache by fetching fresh data
   */
  private static async warmCache(baseUrl: string): Promise<void> {
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
   * Get the current status of the background service
   */
  static getStatus(): {
    isRunning: boolean;
    intervalId: number | null;
    retryCount: number;
    cacheInfo: ReturnType<typeof FeeService.getCacheInfo>;
  } {
    return {
      isRunning: this.isRunning,
      intervalId: this.intervalId,
      retryCount: this.retryCount,
      cacheInfo: FeeService.getCacheInfo(),
    };
  }

  /**
   * Force an immediate cache warm (useful for testing or manual refresh)
   */
  static async forceWarm(baseUrl: string): Promise<void> {
    logger.info("stamps", {
      message: "Forcing immediate fee cache warm",
    });

    await this.warmCache(baseUrl);
  }

  /**
   * Check if the service is running
   */
  static get running(): boolean {
    return this.isRunning;
  }
} 