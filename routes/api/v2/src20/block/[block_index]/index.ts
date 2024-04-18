import { getClient, Src20Class } from "$lib/database/index.ts";
import { paginate } from "utils/util.ts";
import { convertToEmoji } from "utils/util.ts";
import {
  BlockHandlerContext,
  ErrorResponseBody,
  PaginatedRequest,
  PaginatedSrc20ResponseBody,
} from "globals";
import { CommonClass } from "../../../../../../lib/database/index.ts";
import { jsonStringifyBigInt } from "../../../../../../lib/utils/util.ts";

/**
 * @swagger
 * /api/v2/src20/block/{block_index}:
 *   get:
 *     summary: Get paginated valid src20 transactions from a specific block
 *     parameters:
 *       - in: path
 *         name: block_index
 *         required: true
 *         schema:
 *           type: integer
 *         description: The index of the block
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: The maximum number of transactions to retrieve (default: 1000)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: The page number of the results (default: 1)
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedSrc20ResponseBody'
 *       '500':
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponseBody'
 */

export const handler = async (
  req: PaginatedRequest,
  ctx: BlockHandlerContext,
): Promise<Response> => {
  const { block_index } = ctx.params;
  try {
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit")) || 1000;
    const page = Number(url.searchParams.get("page")) || 1;
    const client = await getClient();
    const valid_src20_txs_in_block = await Src20Class
      .get_valid_src20_tx_from_block_with_client(
        client,
        Number(block_index),
        limit,
        page,
      );
    const total = await Src20Class
      .get_total_valid_src20_tx_with_client(
        client,
        null,
        null,
        Number(block_index),
      );
    const last_block = await CommonClass.get_last_block_with_client(client);
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
