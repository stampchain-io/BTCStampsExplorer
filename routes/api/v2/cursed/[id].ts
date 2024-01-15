import { HandlerContext } from "$fresh/server.ts";
import { connectDb, CommonClass, StampsClass, summarize_issuances } from "$lib/database/index.ts";
import {
  ErrorResponseBody,
  IdHandlerContext,
  StampResponseBody,
} from "globals";

export const handler = async (_req: Request, ctx: IdHandlerContext): Promise<Response> => {
  const { id } = ctx.params;
  try {
    const client = await connectDb();
    let data; 
    if (Number.isInteger(Number(id))) {
      data = await StampsClass.get_stamp_by_stamp_with_client(client, id)
    } else {
      data = await StampsClass.get_stamp_by_identifier_with_client(client, id);
    }
    const last_block = await CommonClass.get_last_block_with_client(client);
    const stamp = await summarize_issuances(data.rows);
    client.close();
    const body: StampResponseBody = {
      last_block: last_block.rows[0]["last_block"],
      data: stamp,
    };
    return new Response(JSON.stringify(body));
  } catch {
    const body: ErrorResponseBody = { error: `Error: Internal server error` };
    return new Response(JSON.stringify(body));
  }
};
