import { HandlerContext } from "$fresh/server.ts";
import { CommonClass, CursedClass, getClient } from "$lib/database/index.ts";
import {
  BlockHandlerContext,
  ErrorResponseBody,
  StampBlockResponseBody,
} from "globals";

/**
 * @swagger
 * /api/v2/cursed/block/{block_index}:
 *   get:
 *     summary: Get cursed stamps by block index
 *     parameters:
 *       - in: path
 *         name: block_index
 *         required: true
 *         schema:
 *           type: integer
 *         description: The block index
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StampBlockResponseBody'
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
  const { block_index } = ctx.params;
  try {
    const client = await getClient();
    const block_info = await CommonClass.get_block_info_with_client(
      client,
      block_index,
    );
    const last_block = await CommonClass.get_last_block_with_client(client);
    const cursed = await CursedClass.get_cursed_by_block_index_with_client(
      client,
      block_index,
    );

    const body: StampBlockResponseBody = {
      last_block: last_block.rows[0]["last_block"],
      block_info: block_info.rows[0],
      data: cursed.rows,
    };

    return new Response(JSON.stringify(body));
  } catch {
    const body: ErrorResponseBody = {
      error: `Block: ${block_index} not found`,
    };
    return new Response(JSON.stringify(body));
  }
};
