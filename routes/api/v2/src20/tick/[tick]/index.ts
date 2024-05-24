import { CommonClass, getClient, Src20Class } from "$lib/database/index.ts";
import { paginate } from "utils/util.ts";
import { convertEmojiToTick, convertToEmoji } from "utils/util.ts";
import { BigFloat } from "bigfloat/mod.ts";
import {
  PaginatedRequest,
  PaginatedTickResponseBody,
  TickHandlerContext,
} from "globals";
import { ResponseUtil } from "utils/responseUtil.ts";

export const handler = async (
  req: PaginatedRequest,
  ctx: TickHandlerContext,
): Promise<Response> => {
  let { tick } = ctx.params;
  try {
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit")) || 1000;
    const page = Number(url.searchParams.get("page")) || 1;
    const op = url.searchParams.get("op");
    const sort = url.searchParams.get("sort") || "ASC";
    const client = await getClient();
    tick = convertEmojiToTick(String(tick));
    const src20_txs = await Src20Class
      .get_valid_src20_tx_with_client(
        client,
        null,
        tick,
        op,
        limit,
        page,
        sort,
      );

    const total = await Src20Class.get_total_valid_src20_tx_with_client(
      client,
      tick,
      op,
    );
    const last_block = await CommonClass.get_last_block_with_client(client);
    const pagination = paginate(total.rows[0]["total"], page, limit);
    //TODO: review this
    const mint_status = await Src20Class
      .get_src20_minting_progress_by_tick_with_client(
        client,
        tick,
      );
    const body: PaginatedTickResponseBody = {
      ...pagination,
      last_block: last_block.rows[0]["last_block"],
      mint_status: {
        ...mint_status,
        max_supply: (mint_status.max_supply
          ? mint_status.max_supply.toString()
          : null) as string,
        total_minted: (mint_status.total_minted
          ? mint_status.total_minted.toString()
          : null) as string,
        limit: mint_status.limit ? mint_status.limit : null,
      },
      data: src20_txs.rows.map((tx: any) => {
        return {
          ...tx,
          tick: convertToEmoji(tx.tick),
          max: tx.max ? new BigFloat(tx.max).toString() : null,
          lim: tx.lim ? new BigFloat(tx.lim).toString() : null,
          amt: tx.amt ? new BigFloat(tx.amt).toString() : null,
        };
      }),
    };

    return ResponseUtil.success(body);
  } catch (_error) {
    console.log(_error);
    return ResponseUtil.error("Error: Internal server error");
  }
};
