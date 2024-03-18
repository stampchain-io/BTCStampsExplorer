import { HandlerContext } from "$fresh/server.ts";
import { api_get_stamp_balance } from "$lib/controller/wallet.ts";
import { CommonClass, connectDb, StampsClass } from "$lib/database/index.ts";
import { paginate } from "$lib/utils/util.ts";
import {
  AddressHandlerContext,
  ErrorResponseBody,
  PaginatedRequest,
  PaginatedStampBalanceResponseBody,
} from "globals";

/**
 * @swagger
 * /balance/{address}:
 *   get:
 *     summary: Get stamp balances by address
 *     description: Retrieve stamp balances for a specific address
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         description: The address to retrieve stamp balances for
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         description: The maximum number of stamp balances to retrieve (default: 1000)
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         description: The page number of stamp balances to retrieve (default: 1)
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedStampBalanceResponseBody'
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponseBody'
 */

export const handler = async (
  _req: PaginatedRequest,
  ctx: AddressHandlerContext,
): Promise<Response> => {
  const { address } = ctx.params;
  try {
    const url = new URL(_req.url);
    const limit = Number(url.searchParams.get("limit")) || 1000;
    const page = Number(url.searchParams.get("page")) || 1;

    const client = await connectDb();
    const data = await CommonClass.get_stamp_balances_by_address_with_client(
      client,
      address,
      limit,
      page,
    );
    const total =
      (await CommonClass.get_total_stamp_balance_with_client(client, address))
        .rows[0]["total"] || 0;
    const last_block = await CommonClass.get_last_block_with_client(client);
    await client.close();

    const pagination = paginate(total, page, limit);

    const body: PaginatedStampBalanceResponseBody = {
      ...pagination,
      last_block: last_block.rows[0]["last_block"],
      data: data,
    };
    return new Response(JSON.stringify(body));
  } catch {
    const body: ErrorResponseBody = { error: `Error: Internal server error` };
    return new Response(JSON.stringify(body));
  }
};
