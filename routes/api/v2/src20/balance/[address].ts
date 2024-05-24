import { CommonClass, getClient, Src20Class } from "$lib/database/index.ts";
import { AddressHandlerContext, PaginatedSrc20ResponseBody } from "globals";
import { ResponseUtil } from "utils/responseUtil.ts";

export const handler = async (
  _req: Request,
  ctx: AddressHandlerContext,
): Promise<Response> => {
  const { address } = ctx.params;
  const url = new URL(_req.url);
  const params = url.searchParams;
  const limit = Number(params.get("limit")) || 1000;
  const page = Number(params.get("page")) || 1;
  const amt = Number(params.get("amt"));
  const sort = params.get("sort") || "ASC";

  try {
    const client = await getClient();
    const last_block = await CommonClass.get_last_block_with_client(client);
    const src20 = await Src20Class.get_src20_balance_with_client(
      client,
      address,
      null,
      amt,
      limit,
      page,
      sort,
    );

    if (!src20) {
      return ResponseUtil.error(`Error: SRC20 balance not found`, 404);
    }
    const total = src20.length;
    const body: PaginatedSrc20ResponseBody = {
      page: page,
      limit: limit,
      totalPages: Math.ceil(total / limit),
      total: total,
      last_block: last_block.rows[0]["last_block"],
      data: src20,
    };
    return ResponseUtil.success(body);
  } catch (_error) {
    return ResponseUtil.error("Error: Internal server error");
  }
};
