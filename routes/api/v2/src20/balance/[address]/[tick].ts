import { CommonClass, getClient, Src20Class } from "$lib/database/index.ts";
import { Client } from "$mysql/mod.ts";
import {
  AddressHandlerContext,
  PaginatedSrc20BalanceResponseBody,
} from "globals";
import { ResponseUtil } from "utils/responseUtil.ts"; // Import the responseUtil helper
import Big from "https://esm.sh/big.js";

export const handler = async (
  req: Request,
  ctx: AddressHandlerContext,
): Promise<Response> => {
  const { address } = ctx.params;
  const url = new URL(req.url);
  const params = url.searchParams;
  const limit = Number(params.get("limit")) || 1000;
  const page = Number(params.get("page")) || 1;
  const amt = Big(params.get("amt"));
  const sort = params.get("sort") || "ASC";
  try {
    const client = await getClient();
    const last_block = await CommonClass.get_last_block_with_client(client);
    const src20 = await Src20Class.get_src20_balance_with_client(
      client as Client,
      address,
      null,
      amt,
      limit,
      page,
      sort,
    );
    const total = src20.length;

    const body: PaginatedSrc20BalanceResponseBody = {
      page: page,
      limit: limit,
      totalPages: Math.ceil(total / limit),
      total: total,
      last_block: last_block.rows[0]["last_block"],
      data: src20,
    };
    return ResponseUtil.success(body);
  } catch (error) {
    console.error("Failed to get SRC20 balance:", error);
    return ResponseUtil.error(`Error: Internal server error`);
  }
};
