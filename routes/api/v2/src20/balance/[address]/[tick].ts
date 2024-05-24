import { CommonClass, getClient, Src20Class } from "$lib/database/index.ts";
import { Client } from "$mysql/mod.ts";
import { AddressTickHandlerContext, Src20BalanceResponseBody } from "globals";
import { ResponseUtil } from "utils/responseUtil.ts"; // Import the responseUtil helper

export const handler = async (
  _req: Request,
  ctx: AddressTickHandlerContext,
): Promise<Response> => {
  const { address, tick } = ctx.params;
  try {
    const client = await getClient();
    const last_block = await CommonClass.get_last_block_with_client(client);
    const src20 = await Src20Class.get_src20_balance_with_client(
      client as Client,
      address,
      tick.toString(),
    );

    if (!src20) {
      return ResponseUtil.error(`Error: SRC20 balance not found`, 404);
    }

    const body: Src20BalanceResponseBody = {
      last_block: last_block.rows[0]["last_block"],
      data: src20,
    };
    return ResponseUtil.success(body);
  } catch (_error) {
    return ResponseUtil.error(`Error: Internal server error`);
  }
};
