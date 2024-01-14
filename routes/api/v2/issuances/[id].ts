import { HandlerContext } from "$fresh/server.ts";
import { CommonClass, connectDb, StampsClass } from "$lib/database/index.ts";
import {
  ErrorResponseBody,
  IdHandlerContext,
  StampResponseBody,
} from "globals";

export const handler = async (
  _req: Request,
  ctx: IdHandlerContext,
): Promise<Response> => {
  const { id } = ctx.params;
  try {
    const client = await connectDb();
    let data;
    if (Number.isInteger(Number(id))) {
      data = await CommonClass.get_issuances_by_stamp_with_client(client, id);
    } else {
      data = await StampsClass.get_issuances_by_identifier_with_client(
        client,
        id,
      );
    }
    const last_block = await CommonClass.get_last_block_with_client(client);
    client.close();
    const body: StampResponseBody = JSON.stringify({
      data: data.rows,
      last_block: last_block.rows[0]["last_block"],
    });
    return new Response(body);
  } catch (error) {
    // console.log(error)
    const body: ErrorResponseBody = { error: `Error: Internal server error` };
    return new Response(JSON.stringify(body));
  }
};
