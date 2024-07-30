import { Src20Class } from "$lib/database/index.ts";
import { Client } from "$mysql/mod.ts";
import { AddressTickHandlerContext, Src20BalanceResponseBody } from "globals";
import { ResponseUtil } from "utils/responseUtil.ts"; // Import the responseUtil helper
import { BlockService } from "$lib/services/blockService.ts";
import { dbManager } from "$lib/database/db.ts";

export const handler = async (
  _req: Request,
  ctx: AddressTickHandlerContext,
): Promise<Response> => {
  const { address, tick } = ctx.params;
  try {
    const client = await dbManager.getClient();
    const lastBlock = await BlockService.getLastBlock();
    const src20 = await Src20Class.get_src20_balance_with_client(
      client as Client,
      address,
      tick.toString(),
    );

    if (!src20) {
      return ResponseUtil.error(`Error: SRC20 balance not found`, 404);
    }

    const body: Src20BalanceResponseBody = {
      last_block: lastBlock.last_block,
      data: src20,
    };
    return ResponseUtil.success(body);
  } catch (_error) {
    return ResponseUtil.error(`Error: Internal server error`);
  }
};
