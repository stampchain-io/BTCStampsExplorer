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
    const data = await CommonClass.get_stamp_balances_by_address_with_client(
      client,
      address,
      limit,
      page,
    );
    const total =
      (await CommonClass.get_total_stamp_balance_with_client(client, address))
        .rows[0]["total"] || 0;
    const last_block = await CommonClass.get_last_block_with_client(client);

    const pagination = paginate(total, page, limit);

    const body: PaginatedStampBalanceResponseBody = {
      ...pagination,
      last_block: last_block.rows[0]["last_block"],
      data: data,
    };
    return ResponseUtil.success(body);
  } catch (error) {
    const body: ErrorResponseBody = { error: `Error: Internal server error` };
    return ResponseUtil.error(body.error, 500);
  }
};
