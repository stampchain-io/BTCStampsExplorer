import { HandlerContext } from "$fresh/server.ts";
import { connectDb, Src20Class } from "$lib/database/index.ts";
import { convertEmojiToTick, paginate } from "utils/util.ts";
import {
  convertToEmoji,
  jsonStringifyBigInt,
} from "../../../../../../lib/utils/util.ts";
import {
  BlockTickHandlerContext,
  ErrorResponseBody,
  PaginatedRequest,
  PaginatedSrc20ResponseBody,
} from "globals";
import { CommonClass } from "../../../../../../lib/database/index.ts";

/**
 * @swagger
 * /api/v2/src20/block/{block_index}/{tick}:
 *   get:
 *     summary: Get valid src20 transactions from a specific block and tick.
 *     parameters:
 *       - in: path
 *         name: block_index
 *         required: true
 *         schema:
 *           type: string
 *         description: The index of the block.
 *       - in: path
 *         name: tick
 *         required: true
 *         schema:
 *           type: string
 *         description: The tick value.
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1000
 *         description: The maximum number of transactions to return per page.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: The page number.
 *     responses:
 *       '200':
 *         description: Successful response with the list of valid src20 transactions.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedSrc20ResponseBody'
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponseBody'
 */

export const handler = async (
  req: Request,
  ctx: BlockTickHandlerContext,
): Promise<Response> => {
  let { block_index, tick } = ctx.params;
  try {
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit")) || 1000;
    const page = Number(url.searchParams.get("page")) || 1;
    const client = await connectDb();
    const last_block = await CommonClass.get_last_block_with_client(client);

    tick = convertEmojiToTick(tick);
    const valid_src20_txs_in_block = await Src20Class
      .get_valid_src20_tx_from_block_by_tick_with_client(
        client,
        block_index,
        tick,
        limit,
        page,
      );
    const total = await Src20Class
      .get_total_valid_src20_tx_from_block_by_tick_with_client(
        client,
        block_index,
        tick,
      );
    client.close();
    const pagination = paginate(total.rows[0]["total"], page, limit);
    const body: PaginatedSrc20ResponseBody = {
      ...pagination,
      last_block: last_block.rows[0]["last_block"],
      data: valid_src20_txs_in_block.rows.map((tx: any) => {
        return {
          ...tx,
          tick: convertToEmoji(tx.tick),
          amt: tx.amt ? tx.amt.toString() : null,
          lim: tx.lim ? tx.lim.toString() : null,
          max: tx.max ? tx.max.toString() : null,
        };
      }),
    };
    return new Response(jsonStringifyBigInt(body));
  } catch {
    const body: ErrorResponseBody = { error: `Error: Internal server error` };
    return new Response(JSON.stringify(body));
  }
};
