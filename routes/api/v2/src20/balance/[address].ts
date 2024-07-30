import { Src20Class } from "$lib/database/index.ts";
import { AddressHandlerContext, PaginatedSrc20ResponseBody } from "globals";
import { ResponseUtil } from "utils/responseUtil.ts";
import { BlockService } from "$lib/services/blockService.ts";
import { dbManager } from "$lib/database/db.ts";

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
    const client = await dbManager.getClient();
    const lastBlock = await BlockService.getLastBlock();
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
      last_block: lastBlock.last_block,
      data: src20,
    };
    return ResponseUtil.success(body);
  } catch (_error) {
    return ResponseUtil.error("Error: Internal server error");
  }
};
