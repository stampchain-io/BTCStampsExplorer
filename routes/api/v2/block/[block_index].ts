import { HandlerContext } from "$fresh/server.ts";
import { api_get_block } from "$lib/controller/block.ts";
import { isIntOr32ByteHex } from "$lib/utils/util.ts";
import {
  BlockHandlerContext,
  BlockInfoResponseBody,
  ErrorResponseBody,
} from "globals";

/**
 * @swagger
 * /api/v2/block/{block_index}:
 *   get:
 *     summary: Get block info by block index or block hash
 *     parameters:
 *       - in: path
 *         name: block_index
 *         required: true
 *         schema:
 *           type: string
 *         description: The block index or block hash
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BlockInfoResponseBody'
 *       '500':
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponseBody'
 */
export const handler = async (
  _req: Request,
  ctx: BlockHandlerContext,
): Promise<Response> => {
  const block_index_or_hash = ctx.params.block_index;

  if (!isIntOr32ByteHex(block_index_or_hash)) {
    return new Response(
      JSON.stringify({
        error:
          "Invalid argument provided. Must be an integer or 32 byte hex string.",
      }),
      {
        status: 400, // Bad Request
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  try {
    const response: BlockInfoResponseBody = await api_get_block(
      block_index_or_hash,
    );
    const body = JSON.stringify(response);
    return new Response(body);
  } catch {
    const body = { error: `Block: ${block_index_or_hash} not found` };
    return new Response(JSON.stringify(body));
  }
};
