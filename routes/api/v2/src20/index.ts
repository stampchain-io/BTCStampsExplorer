import { FreshContext } from "$fresh/server.ts";
import { getClient, Src20Class } from "$lib/database/index.ts";
import { BlockService } from "$lib/services/blockService.ts";
import { BigFloat } from "bigfloat/mod.ts";
import { convertToEmoji, paginate } from "utils/util.ts";
import {
  ErrorResponseBody,
  PaginatedRequest,
  PaginatedSrc20ResponseBody,
} from "globals";
import { ResponseUtil } from "utils/responseUtil.ts";

export const handler = async (
  req: PaginatedRequest,
  _ctx: FreshContext,
): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit")) || 1000;
    const page = Number(url.searchParams.get("page")) || 1;
    const client = await getClient();
    const data = await Src20Class.get_valid_src20_tx_with_client(
      client,
      null,
      null,
      null,
      limit,
      page,
    );
    const total = await Src20Class.get_total_valid_src20_tx_with_client(
      client,
    );
    const lastBlock = await BlockService.getLastBlock();
    const pagination = paginate(total.rows[0].total, page, limit);
    const body: PaginatedSrc20ResponseBody = {
      ...pagination,
      last_block: lastBlock.last_block,
      data: data.rows.map((row: any) => {
        return {
          ...row,
          tick: convertToEmoji(row.tick),
          max: row.max ? new BigFloat(row.max).toString() : null,
          lim: row.lim ? new BigFloat(row.lim).toString() : null,
          amt: row.amt ? new BigFloat(row.amt).toString() : null,
        };
      }),
    };
    return ResponseUtil.success(body);
  } catch (_error) {
    const body: ErrorResponseBody = { error: `Error: Internal server error` };
    return ResponseUtil.error(body.error, 500);
  }
};
