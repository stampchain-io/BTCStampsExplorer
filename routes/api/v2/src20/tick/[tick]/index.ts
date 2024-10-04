import { Handlers } from "$fresh/server.ts";
import { convertEmojiToTick, convertToEmoji } from "utils/util.ts";
import { PaginatedTickResponseBody } from "globals";
import { ResponseUtil } from "utils/responseUtil.ts";
import { Src20Controller } from "$lib/controller/src20Controller.ts";
import { getPaginationParams } from "$lib/utils/paginationUtils.ts";
import { BigFloat } from "bigfloat/mod.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    try {
      const { tick } = ctx.params;
      const url = new URL(req.url);
      const { limit, page } = getPaginationParams(url);
      const opParam = url.searchParams.get("op") || undefined;

      const params = {
        tick: convertEmojiToTick(String(tick)),
        limit,
        page,
        op: opParam,
        sortBy: url.searchParams.get("sortBy") ||
          url.searchParams.get("sort") || "DESC",
      };

      // Fetch data using controller
      const { src20_txs, total, lastBlock, mint_status } = await Src20Controller
        .getTickData(params);

      // Prepare pagination variables
      const totalPages = Math.ceil(total / limit);

      // Map data, ensuring all necessary fields are included
      const data = src20_txs.rows.map((tx: any) => ({
        ...tx,
        tick: convertToEmoji(tx.tick),
        max: tx.max ? new BigFloat(tx.max).toString() : null,
        lim: tx.lim ? new BigFloat(tx.lim).toString() : null,
        amt: tx.amt ? new BigFloat(tx.amt).toString() : null,
      }));

      // Construct response body
      const body: PaginatedTickResponseBody = {
        page,
        limit,
        total,
        totalPages,
        last_block: lastBlock,
        mint_status: mint_status
          ? {
            ...mint_status,
            max_supply: mint_status.max_supply?.toString() ?? null,
            total_minted: mint_status.total_minted?.toString() ?? null,
            limit: mint_status.limit ?? null,
          }
          : null,
        data,
      };

      return ResponseUtil.success(body);
    } catch (error) {
      console.error(error);
      return ResponseUtil.handleError(error, "Error processing request");
    }
  },
};
