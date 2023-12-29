import { HandlerContext } from "$fresh/server.ts";
import { api_get_block } from "$lib/controller/block.ts";
import { isIntOr32ByteHex } from "$lib/utils/util.ts";

export const handler = async (_req: Request, ctx: HandlerContext) => {
  const block_index_or_hash = ctx.params.block_index;

  if (!isIntOr32ByteHex(block_index_or_hash)) {
    return new Response(
      JSON.stringify({
        error: "Invalid argument provided. Must be an integer or 32 byte hex string.",
      }),
      {
        status: 400, // Bad Request
        headers: {
          "Content-Type": "application/json",
        },
      },
    );
  }

  try {
    const response = await api_get_block(block_index_or_hash);
    const body = JSON.stringify(response);
    return new Response(body);
  } catch {
    const body = JSON.stringify({ error: `Block: ${block_index_or_hash} not found` });
    return new Response(body);
  }
};
