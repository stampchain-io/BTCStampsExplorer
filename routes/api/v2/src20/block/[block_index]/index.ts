import type { SUBPROTOCOLS } from "$types/base.d.ts";
import type {
  ColumnDefinition,
  FeeAlert,
  InputData,
  MockResponse,
  NamespaceImport,
  ProtocolComplianceLevel,
  ToolEstimationParams,
  XcpBalance,
} from "$types/toolEndpointAdapter.ts";
import type {
  AddressTickHandlerContext,
  BlockHandlerContext,
  IdentHandlerContext,
  TickHandlerContext,
} from "$types/base.d.ts";
import type {
  PaginatedIdResponseBody,
  PaginatedTickResponseBody,
  SRC20TrxRequestParams,
} from "$types/api.d.ts";
import { Handlers } from "$fresh/server.ts";
import { ApiResponseUtil } from "$lib/utils/api/responses/apiResponseUtil.ts";
import { SRC20Service } from "$server/services/src20/index.ts";

export const handler: Handlers<BlockHandlerContext> = {
  async GET(req, ctx) {
    const { block_index } = ctx.params;
    const url = new URL(req.url);
    const tick = url.searchParams.get("tick");

    try {
      const result = await SRC20Service.QueryService.fetchAndFormatSrc20Data({
        block_index: Number(block_index),
        ...(tick && { tick }),
      });
      return ApiResponseUtil.success(result);
    } catch (error) {
      return ApiResponseUtil.internalError(error, "Error processing request");
    }
  },
};
