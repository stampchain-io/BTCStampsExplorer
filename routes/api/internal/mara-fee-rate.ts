/**
 * Internal API endpoint for fetching MARA fee rates
 * This endpoint is for internal use only and should not be exposed publicly
 *
 * GET /api/internal/mara-fee-rate
 */

import { FreshContext, Handlers } from "$fresh/server.ts";
import { ApiResponseUtil } from "$lib/utils/api/responses/apiResponseUtil.ts";
import { MaraSlipstreamService } from "$/server/services/mara/maraSlipstreamService.ts";
import { logger } from "$lib/utils/monitoring/logging/logger.ts";
import { isMaraEnabled } from "$/server/utils/mara/maraFeatureFlag.ts";

interface MaraFeeRateResponse {
  /** Current fee rate in sats/vB */
  fee_rate: number;
  /** Minimum acceptable fee rate in sats/vB */
  min_fee_rate: number;
  /** Timestamp of fee rate data */
  timestamp?: number;
  /** Pool identifier */
  pool: "mara";
}

export const handler: Handlers = {
  async GET(_req: Request, _ctx: FreshContext) {
    try {
      // Check if MARA integration is enabled
      if (!isMaraEnabled()) {
        logger.warn("api", {
          message: "MARA fee rate requested but integration is disabled",
        });
        return ApiResponseUtil.badRequest(
          "MARA integration is not enabled",
        );
      }

      // Check if MARA service is available
      if (!MaraSlipstreamService.isAvailable()) {
        logger.warn("api", {
          message: "MARA service circuit breaker is open",
        });
        return ApiResponseUtil.serviceUnavailable(
          "MARA service temporarily unavailable",
          {
            retryAfter: 60,
          },
        );
      }

      // Fetch fee rate from MARA service
      const feeRateData = await MaraSlipstreamService.getFeeRate();

      logger.info("api", {
        message: "Successfully fetched MARA fee rate",
        feeRate: feeRateData.fee_rate,
        minFeeRate: feeRateData.min_fee_rate,
      });

      // Format response with pool identifier
      const response: MaraFeeRateResponse = {
        fee_rate: feeRateData.fee_rate,
        min_fee_rate: feeRateData.min_fee_rate,
        timestamp: Date.now(),
        pool: "mara",
      };

      // Return with short cache for fee volatility
      return ApiResponseUtil.success(response, {
        headers: {
          "Cache-Control": "public, max-age=30", // Cache for 30 seconds
        },
      });
    } catch (error) {
      const errorMessage = error instanceof Error
        ? error.message
        : "Failed to fetch MARA fee rate";

      logger.error("api", {
        message: "Failed to fetch MARA fee rate",
        error: errorMessage,
        stack: error instanceof Error ? error.stack : undefined,
      });

      // Check for specific error types
      if (errorMessage.includes("circuit breaker")) {
        return ApiResponseUtil.serviceUnavailable(
          "MARA service temporarily unavailable",
        );
      }

      return ApiResponseUtil.internalError(errorMessage);
    }
  },
};
