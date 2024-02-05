import { convertEmojiToTick } from "utils/util.ts";
import {
  AddressTickHandlerContext,
  ErrorResponseBody,
  PaginatedRequest,
  Src20BalanceResponseBody,
} from "globals";
import { CommonClass, connectDb, Src20Class } from "$lib/database/index.ts";
import { BigFloat } from "bigfloat/mod.ts";
import { Client } from "$mysql/mod.ts";

export const handler = async (
  req: Request,
  ctx: AddressTickHandlerContext,
): Promise<Response> => {
  let { tick } = ctx.params;
  const url = new URL(req.url);
  const params = url.searchParams;
  const amt = Number(params.get("amt"));
  const limit = Number(params.get("limit"));
  const page = Number(params.get("page"));
  try {
    const client = await connectDb();
    if (!client) {
      throw new Error("Client not found");
    }
    const last_block = await CommonClass.get_last_block_with_client(client);
    tick = convertEmojiToTick(tick);
    const src20 = await Src20Class.get_src20_holders_by_tick_with_client(
      client as Client,
      tick,
      amt,
      limit,
      page,
    );
    client.close();
    console.log(src20.rows[0]);
    const body: Src20BalanceResponseBody = {
      snapshot_block: last_block.rows[0]["last_block"],
      total: src20.rows.length,
      data: src20.rows.map((row) => {
        return {
          tick: row["tick"],
          address: row["address"],
          balance: new BigFloat(row["amt"]).toString(),
        };
      }).sort((a, b) => {
        return new BigFloat(b.balance).gte(new BigFloat(a.balance));
      }),
    };
    return new Response(JSON.stringify(body));
  } catch (error) {
    console.error(error);
    const body: ErrorResponseBody = { error: `Error: Internal server error` };
    return new Response(JSON.stringify(body));
  }
};
