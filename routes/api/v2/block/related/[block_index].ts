import { Handlers, Request } from "$fresh/server.ts";
import { api_get_related_blocks } from "$lib/controller/block.ts";
import { isIntOr32ByteHex } from "$lib/utils/util.ts";
import {
  BlockHandlerContext,
  BlockRelatedResponseBody,
  ErrorResponseBody,
} from "globals";

/**
 * @swagger
 * /api/v2/block/related/{block_index}:
 *   get:
 *     summary: Get related blocks by block index or block hash
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
 *               $ref: '#/components/schemas/BlockRelatedResponseBody'
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
  let body: BlockRelatedResponseBody | ErrorResponseBody;
  let status = 200; // OK

  if (!isIntOr32ByteHex(block_index_or_hash)) {
    body = {
      error:
        "Invalid argument provided. Must be an integer or 32 byte hex string.",
    };
    status = 400;
  } else {
    try {
      const response: BlockRelatedResponseBody = await api_get_related_blocks(
        block_index_or_hash,
      );
      body = response;
    } catch {
      body = {
        error: `Block: ${block_index_or_hash} not found`,
      };
      status = 404;
    }
  }

  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "Content-Type": "application/json",
    },
  });
};
