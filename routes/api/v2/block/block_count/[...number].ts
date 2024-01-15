import {
  HandlerContext,
  Handlers,
  Request,
} from "$fresh/server.ts";
import { CommonClass, connectDb } from "$lib/database/index.ts";
import { BlockInfo, ErrorResponseBody, IdHandlerContext} from "globals";

export const handler: Handlers = {
  async GET(_req: Request, ctx: IdHandlerContext) {
    const number = ctx.params.number ? parseInt(ctx.params.number) : 1;

    if (Number.isNaN(number) || number < 1 || number > 100) {
      const body: ErrorResponseBody = { error: "Invalid number provided. Must be a number between 1 and 100." }
      return new Response(JSON.stringify(body));
    }
    
    try {
      const client = await connectDb();
      const lastBlocks = await CommonClass.get_last_x_blocks_with_client(client, number);
      await client.close();
      const body: BlockInfo = lastBlocks
      return new Response(JSON.stringify(body));
    } catch (error) {
      console.error('Failed to get last blocks:', error);
      const body: ErrorResponseBody = {
        error: `Related blocks not found`,
      };
      return new Response(JSON.stringify(body));
    
    }
  },
};
