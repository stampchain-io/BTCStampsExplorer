import { api_get_src20_balance_by_tick } from "$lib/controller/wallet.ts";
import { convertEmojiToTick } from "utils/util.ts";
import {
  AddressTickHandlerContext,
  ErrorResponseBody,
  Src20BalanceResponseBody,
} from "globals";
import {
  CommonClass,
  getClient,
} from "../../../../../../lib/database/index.ts";

/**
 * @swagger
 * /api/v2/src20/balance/{address}/{tick}:
 *   get:
 *     summary: Get src20 balance by address and tick
 *     parameters:
 *       - in: path
 *         name: address
 *         required: true
 *         schema:
 *           type: string
 *         description: The address of the wallet
 *       - in: path
 *         name: tick
 *         required: true
 *         schema:
 *           type: string
 *         description: The tick value
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
export const handler = async (
  _req: Request,
  ctx: AddressTickHandlerContext,
): Promise<Response> => {
  let { address, tick } = ctx.params;
  try {
    const client = await getClient();
    const last_block = await CommonClass.get_last_block_with_client(client);
    tick = convertEmojiToTick(tick);
    const src20 = await api_get_src20_balance_by_tick(address, tick);
    const body: Src20BalanceResponseBody = {
      last_block: last_block.rows[0]["last_block"],
      data: src20,
    };
    return new Response(JSON.stringify(body));
  } catch (error) {
    const body: ErrorResponseBody = { error: `Error: Internal server error` };
    return new Response(JSON.stringify(body));
  }
};
