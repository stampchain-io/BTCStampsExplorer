import { HandlerContext } from "$fresh/server.ts";
import {
  CommonClass,
  connectDb,
  summarize_issuances,
} from "$lib/database/index.ts";
import { api_get_stamp } from "$lib/controller/stamp.ts";
import {
  ErrorResponseBody,
  IdHandlerContext,
  StampResponseBody,
} from "globals";
} from "globals";

/**
 * @swagger
 * /api/v2/stamps/{id}:
 *   get:
 *     summary: Get stamp by ID
 *     description: Retrieve a stamp by its ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the stamp
 *         schema:
 *           type: string
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
  const id = String(ctx.params.id);
  // const id = String(ctx.params);
  try {
    const client = await connectDb();
    const data = await api_get_stamp(id);
    let last_block;
    if (client) {
      last_block = await CommonClass.get_last_block_with_client(client);
      client.close();
    }
    if (!data) {
      throw new Error("Stamp not found");
    }
    const body: StampResponseBody = {
      last_block: last_block.rows[0]["last_block"],
      data: data,
    };
    return new Response(JSON.stringify(body));
  } catch {
    const body: ErrorResponseBody = { error: `Error: Internal server error` };
    return new Response(JSON.stringify(body));
  }
};
