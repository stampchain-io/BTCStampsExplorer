import { CommonClass, getClient, Src20Class } from "$lib/database/index.ts";
import {
  AddressHandlerContext,
  ErrorResponseBody,
  Src20BalanceResponseBody,
} from "globals";

export const handler = async (
  _req: Request,
  ctx: AddressHandlerContext,
): Promise<Response> => {
  const { address } = ctx.params;
  try {
    const client = await getClient();
    const last_block = await CommonClass.get_last_block_with_client(client);
    const src20 = await Src20Class.get_src20_balance_with_client(
      client,
      address,
    );
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
