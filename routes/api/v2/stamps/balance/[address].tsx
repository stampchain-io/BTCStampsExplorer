import { CommonClass, getClient, StampsClass } from "$lib/database/index.ts";
import { paginate } from "$lib/utils/util.ts";
import {
  AddressHandlerContext,
  ErrorResponseBody,
  PaginatedRequest,
  PaginatedStampBalanceResponseBody,
} from "globals";
import { ResponseUtil } from "utils/responseUtil.ts";

export const handler = async (
  _req: PaginatedRequest,
  ctx: AddressHandlerContext,
): Promise<Response> => {
  const { address } = ctx.params;
  try {
    const url = new URL(_req.url);
    const limit = Number(url.searchParams.get("limit")) || 1000;
    const page = Number(url.searchParams.get("page")) || 1;

    const client = await getClient();

    // Combine database queries into a single Promise.all call
    const [data, totalResult, last_block] = await Promise.all([
      CommonClass.get_stamp_balances_by_address(
        client,
        address,
        limit,
        page,
      ),
      CommonClass.get_count_stamp_balances_by_address(client, address),
      CommonClass.get_last_block_with_client(client),
    ]);

    const total = totalResult.rows[0]?.total || 0;
    const pagination = paginate(total, page, limit);

    const body: PaginatedStampBalanceResponseBody = {
      ...pagination,
      last_block: last_block.rows[0]?.last_block,
      data: data,
    };
    return ResponseUtil.success(body);
  } catch (error) {
    console.error("Error in stamp balance handler:", error);
    const body: ErrorResponseBody = { error: "Internal server error" };
    return ResponseUtil.error(body.error, 500);
  }
};
