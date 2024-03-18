import { HandlerContext } from "$fresh/server.ts";
import {
  CommonClass,
  getClient,
  StampsClass,
  summarize_issuances,
} from "$lib/database/index.ts";
import {
  ErrorResponseBody,
  IdHandlerContext,
  StampResponseBody,
} from "globals";

/**
 * @swagger
 * /api/v2/stamps/issuances/{id}:
 *   get:
 *     summary: Get stamp issuances by stamp id or identifier
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The stamp id or identifier
 *     responses:
 *       '200':
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StampResponseBody'
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponseBody'
 */
export const handler = async (
  _req: Request,
  ctx: IdHandlerContext,
): Promise<Response> => {
  const { id } = ctx.params;
  try {
    const client = await getClient();
    let data;
    if (Number.isInteger(Number(id))) {
      data = await StampsClass.get_stamp_by_stamp_with_client(client, id);
    } else {
      data = await StampsClass.get_stamp_by_identifier_with_client(client, id);
    }
    const last_block = await CommonClass.get_last_block_with_client(client);
    const stamp = await summarize_issuances(data.rows);
    const body: StampResponseBody = {
      last_block: last_block.rows[0]["last_block"],
      data: stamp,
    };
    return new Response(JSON.stringify(body));
  } catch {
    const body: ErrorResponseBody = { error: `Error: Internal server error` };
    return new Response(JSON.stringify(body));
  }
};
