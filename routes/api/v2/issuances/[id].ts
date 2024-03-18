import { HandlerContext } from "$fresh/server.ts";
import { CommonClass, connectDb, StampsClass } from "$lib/database/index.ts";
import {
  ErrorResponseBody,
  IdHandlerContext,
  StampsResponseBody,
} from "globals";

/**
 * @swagger
 * /api/v2/issuances/{id}:
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
 *               $ref: '#/components/schemas/StampsResponseBody'
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
    const client = await connectDb();
    let data;
    if (Number.isInteger(Number(id))) {
      data = await CommonClass.get_issuances_by_stamp_with_client(client, id);
    } else {
      data = await StampsClass.get_issuances_by_identifier_with_client(
        client,
        id,
      );
    }
    const last_block = await CommonClass.get_last_block_with_client(client);
    await client.close();
    const body: StampsResponseBody = {
      last_block: last_block.rows[0]["last_block"],
      data: data.rows,
    };
    return new Response(JSON.stringify(body));
  } catch (error) {
    // console.log(error)
    const body: ErrorResponseBody = { error: `Error: Internal server error` };
    return new Response(JSON.stringify(body));
  }
};
