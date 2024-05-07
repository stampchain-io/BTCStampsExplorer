import { Src20Class } from "$lib/database/index.ts";
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

export const handler = async (
  _req: Request,
  ctx: AddressTickHandlerContext,
): Promise<Response> => {
  let { address, tick } = ctx.params;
  try {
    const client = await getClient();
    const last_block = await CommonClass.get_last_block_with_client(client);
    tick = convertEmojiToTick(tick);
    const src20 = await Src20Class.get_src20_balance_with_client(
      client,
      address,
      tick,
    );
    const body: Src20BalanceResponseBody = {
      last_block: last_block.rows[0]["last_block"],
      data: src20,
    };
    return new Response(JSON.stringify(body));
  } catch (error) {
    console.log(error);
    const body: ErrorResponseBody = { error: `Error: Internal server error` };
    return new Response(JSON.stringify(body));
  }
};
