import { HandlerContext } from "$fresh/server.ts";
import { api_get_src20_balance } from "$lib/controller/wallet.ts";
import {
  ErrorResponseBody,
  PaginatedRequest,
  Src20BalanceResponseBody,
  AddressHandlerContext,
} from "globals";
import { CommonClass, connectDb } from "../../../../../lib/database/index.ts";


/**
 * @swagger
 * /api/v2/src20/balance/{address}:
 *   get:
 *     summary: Get src20 balance by address
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: The address of the wallet
 *     responses:
 *       '200':
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Src20BalanceResponseBody'
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponseBody'
 */
export const handler = async (_req: Request, ctx: AddressHandlerContext): Promise<Response> => {
  const { address } = ctx.params;
  try {
    const client = await connectDb();
    const last_block = await CommonClass.get_last_block_with_client(client);
    client.close();
    const src20 = await api_get_src20_balance(address);
    const body: Src20BalanceResponseBody = {
      last_block: last_block.rows[0]["last_block"],
      data: src20,
    };
    return new Response(JSON.stringify(body));
  } catch {
    const body: ErrorResponseBody = { error: `Error: Internal server error` };
    return new Response(JSON.stringify(body));
  }
};
