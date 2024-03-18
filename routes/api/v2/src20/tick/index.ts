import { HandlerContext } from "$fresh/server.ts";
import { CommonClass, connectDb, Src20Class } from "$lib/database/index.ts";
import { jsonStringifyBigInt, paginate } from "utils/util.ts";
import { BigFloat } from "bigfloat/mod.ts";
import {
  ErrorResponseBody,
  PaginatedRequest,
  PaginatedSrc20ResponseBody,
} from "globals";

/**
 * @swagger
 * /api/v2/src20/tick:
 *   get:
 *     summary: Get paginated valid src20 transactions by operation type
 *     description: Retrieve paginated valid src20 transactions by operation type (DEPLOY)
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1000
 *         description: The maximum number of transactions to retrieve per page
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: The page number of transactions to retrieve
 *     responses:
 *       '200':
 *         description: Successful response with paginated src20 transactions
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedSrc20ResponseBody'
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponseBody'
 */

export const handler = async (
  req: PaginatedRequest,
  _ctx: HandlerContext,
): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit")) || 1000;
    const page = Number(url.searchParams.get("page")) || 1;
    const client = await connectDb();
    const data = await Src20Class.get_valid_src20_tx_by_op_with_client(
      client,
      "DEPLOY",
      limit,
      page,
    );
    const total = await Src20Class.get_total_valid_src20_tx_by_op_with_client(
      client,
      "DEPLOY",
    );
    const last_block = await CommonClass.get_last_block_with_client(client);
    await client.close();

    const pagination = paginate(total.rows[0]["total"], page, limit);
    const body: PaginatedSrc20ResponseBody = {
      ...pagination,
      last_block: last_block.rows[0]["last_block"],
      data: data.rows.map((row: any) => {
        return {
          ...row,
          max: row.max ? new BigFloat(row.max).toString() : null,
          lim: row.lim ? new BigFloat(row.lim).toString() : null,
          amt: row.amt ? new BigFloat(row.amt).toString() : null,
        };
      }),
    };
    return new Response(jsonStringifyBigInt(body));
  } catch (error) {
    const body: ErrorResponseBody = { error: `Error: Internal server error` };
    return new Response(JSON.stringify(body));
  }
};
