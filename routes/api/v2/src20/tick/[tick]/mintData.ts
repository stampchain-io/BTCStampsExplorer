import { Handlers } from "$fresh/server.ts";
import { Src20Controller } from "$server/controller/src20Controller.ts";
import { logger } from "$lib/utils/logger.ts";
import { ApiResponseUtil } from "$lib/utils/apiResponseUtil.ts";
import type { SRC20MintDataResponse } from "$lib/types/src20.d.ts";
import { SRC20Service } from "$server/services/src20/index.ts";

export const handler: Handlers = {
  async GET(_req, ctx) {
    try {
      const { tick } = ctx.params;
      if (!tick) {
        return ApiResponseUtil.badRequest("Tick parameter is required");
      }

      const normalizedTick = String(tick);

      const [mintStatus, balanceData] = await Promise.all([
        SRC20Service.QueryService.fetchSrc20MintProgress(normalizedTick),
        Src20Controller.handleSrc20BalanceRequest({
          tick: normalizedTick,
          includePagination: true,
          limit: 1,
          page: 1,
        }),
      ]);

      const response: SRC20MintDataResponse = {
        mintStatus,
        holders: balanceData.total || 0,
      };

      return ApiResponseUtil.success(response);
    } catch (error) {
      logger.error("stamps", {
        message: "Error in /api/v2/src20/tick/[tick]/mintData",
        data: {
          error: error instanceof Error ? error.message : String(error),
        },
      });

      return ApiResponseUtil.internalError(
        error,
        "Error fetching mint data",
      );
    }
  },
};
