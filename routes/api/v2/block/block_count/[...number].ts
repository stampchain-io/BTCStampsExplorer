import { CommonClass, getClient } from "$lib/database/index.ts";
import { BlockInfo, ErrorResponseBody } from "globals";

/**
 * @swagger
 * /api/v2/block/block_count/{number}:
 *   get:
 *     summary: Get last blocks
 *     parameters:
 *       - in: path
 *         name: number
 *         required: true
 *         schema:
 *           type: integer
 *         description: The number of last blocks
 *     responses:
 *       '200':
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/BlockInfo'
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponseBody'
 */

export const handler = async (
  _req: Request,
  ctx: { params: { number: string } },
): Promise<Response> => {
  const { number } = ctx.params;
  const parsedNumber = number ? parseInt(number) : 1;

  if (Number.isNaN(parsedNumber) || parsedNumber < 1 || parsedNumber > 100) {
    const body: ErrorResponseBody = {
      error: "Invalid number provided. Must be a number between 1 and 100.",
    };
    return new Response(JSON.stringify(body));
  }

  try {
    const client = await getClient();
    const lastBlocks = await CommonClass.get_last_x_blocks_with_client(
      client,
      parsedNumber,
    );
    const body: BlockInfo = lastBlocks;
    return new Response(JSON.stringify(body));
  } catch (error) {
    console.error("Failed to get last blocks:", error);
    const body: ErrorResponseBody = {
      error: `Blocks not found`,
    };
    return new Response(JSON.stringify(body));
  }
};
