import { HandlerContext } from "$fresh/server.ts";
import { api_get_src20_valid_tx } from "$lib/controller/wallet.ts";
import { BigFloat } from "bigfloat/mod.ts";
import { convertToEmoji } from "utils/util.ts";
import { CommonClass, connectDb } from "../../../../../lib/database/index.ts";
import {
  ErrorResponseBody,
  PaginatedRequest,
  Src20ResponseBody,
  TxHandlerContext,
} from "globals";

/**
 * @swagger
 * /api/v2/src20/tx/{tx_hash}:
 *   get:
 *     summary: Get information about a specific transaction.
 *     parameters:
 *       - in: path
 *         name: tx_hash
 *         required: true
 *         schema:
 *           type: string
 *         description: The hash of the transaction.
 *     responses:
 *       '200':
 *         description: Successful response with transaction information.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Src20ResponseBody'
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponseBody'
 */

export const handler = async (
  _req: Request,
  ctx: TxHandlerContext,
): Promise<Response> => {
  const { tx_hash } = ctx.params;
  try {
    const tx_info = await api_get_src20_valid_tx(tx_hash);
    const client = await connectDb();
    const last_block = await CommonClass.get_last_block_with_client(client);
    await client.close();
    const body: Src20ResponseBody = {
      last_block: last_block.rows[0]["last_block"],
      data: {
        ...tx_info,
        amt: tx_info.amt ? new BigFloat(tx_info.amt).toString() : null,
        lim: tx_info.lim ? new BigFloat(tx_info.lim).toString() : null,
        max: tx_info.max ? new BigFloat(tx_info.max).toString() : null,
        tick: convertToEmoji(tx_info.tick),
      },
    };
    return new Response(JSON.stringify(body));
  } catch (error) {
    const body: ErrorResponseBody = { error: `Error: Internal server error` };
    return new Response(JSON.stringify(body));
  }
};
