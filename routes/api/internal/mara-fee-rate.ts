/**
 * Internal API endpoint for fetching MARA fee rates
 * This endpoint is for internal use only and should not be exposed publicly
 *
 * GET /api/internal/mara-fee-rate
 */

import { FreshContext, Handlers } from "$fresh/server.ts";
import { ApiResponseUtil } from "$lib/utils/api/responses/apiResponseUtil.ts";
import { MaraSlipstreamService } from "$/server/services/mara/maraSlipstreamService.ts";
import { logger } from "$lib/utils/logger.ts";
import { InternalApiFrontendGuard } from "$server/services/security/internalApiFrontendGuard.ts";

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
  async GET(req: Request, _ctx: FreshContext) {
    try {
      // Security check for internal endpoints
      const originError = InternalApiFrontendGuard.requireInternalAccess(req);
      if (originError) {
        logger.warn("api", {
          message: "Origin validation failed for internal mara-fee-rate",
          origin: new URL(req.url).origin,
        });
        return originError;
      }

      // MARA is always available - activation depends on user providing outputValue

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
        min_fee_rate: feeRateData.min_fee_rate ?? feeRateData.fee_rate,
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
