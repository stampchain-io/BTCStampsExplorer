import { api_get_block } from "$lib/controller/block.ts";
import { isIntOr32ByteHex } from "utils/util.ts";
import { BlockHandlerContext, BlockInfoResponseBody } from "globals";
import { ResponseUtil } from "utils/responseUtil.ts";

export const handler = async (
  _req: Request,
  ctx: BlockHandlerContext,
): Promise<Response> => {
  const block_index_or_hash = ctx.params.block_index;

  if (!isIntOr32ByteHex(block_index_or_hash)) {
    return ResponseUtil.error(
      "Invalid argument provided. Must be an integer or 32 byte hex string.",
      400,
    );
  }

  try {
    const response: BlockInfoResponseBody = await api_get_block(
      block_index_or_hash,
    );
    return ResponseUtil.success(response);
  } catch {
    return ResponseUtil.error(`Block: ${block_index_or_hash} not found`, 404);
  }
};
