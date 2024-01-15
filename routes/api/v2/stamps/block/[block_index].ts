import { HandlerContext } from "$fresh/server.ts";
import { CommonClass, connectDb, StampsClass } from "$lib/database/index.ts";
import { api_get_block } from "$lib/controller/block.ts";

import {
  BlockHandlerContext,
  StampBlockResponseBody,
  ErrorResponseBody,
} from "globals";

export const handler = async (
  _req: Request,
  ctx: BlockHandlerContext,
): Promise<Response> => {
  const { block_index } = ctx.params;
  try {
    const client = await connectDb();
    const block_info = await CommonClass.get_block_info_with_client(
      client,
      block_index,
    );
    const data = await StampsClass.get_stamps_by_block_index_with_client(
      client,
      block_index,
    );
    const last_block = await CommonClass.get_last_block_with_client(client);
    const body: StampBlockResponseBody = {
      last_block: last_block.rows[0]["last_block"],
      block_info: block_info.rows[0],
      data: data.rows,
    };
    return new Response(JSON.stringify(body));
  } catch {
    const body: ErrorResponseBody = {
      error: `Block: ${block_index} not found`,
    };
    return new Response(JSON.stringify(body));
  }
};
