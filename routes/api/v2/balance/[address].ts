import { api_get_balance } from "$lib/controller/wallet.ts";
import { CommonClass, getClient } from "$lib/database/index.ts";
import {
  AddressHandlerContext,
  PaginatedBalanceResponseBody,
  PaginatedRequest,
} from "globals";
// import { paginate } from "utils/util.ts";

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
    const last_block = await CommonClass.get_last_block_with_client(client);
    const body: PaginatedBalanceResponseBody = await api_get_balance(
      address,
      limit,
      page,
    );

    return ResponseUtil.success({
      ...body,
      last_block: last_block.rows[0]["last_block"],
    });
  } catch (error) {
    console.error("Error:", error);
    return ResponseUtil.error("Internal server error", 500);
  }
};
