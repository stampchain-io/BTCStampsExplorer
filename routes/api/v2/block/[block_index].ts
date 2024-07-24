import { BlockService } from "$lib/services/blockService.ts";
import { ResponseUtil } from "utils/responseUtil.ts";
import { isIntOr32ByteHex } from "$lib/utils/util.ts";
import { BlockHandlerContext, ErrorResponseBody } from "globals";

export const handler = async (
  _req: Request,
  ctx: BlockHandlerContext,
): Promise<Response> => {
  const { block_index } = ctx.params;

  if (!isIntOr32ByteHex(block_index)) {
    const body: ErrorResponseBody = {
      error:
        `Invalid input: ${block_index}. It must be a valid block index (integer) or block hash (64 character string).`,
    };
    return ResponseUtil.error(body.error, 400);
  }

  const blockIdentifier = /^\d+$/.test(block_index)
    ? Number(block_index)
    : block_index;
  // now we support api/v2/block/844755/cursed /stamps otherwise default to all
  const type = ctx.url?.pathname?.includes("/cursed/")
    ? "cursed"
    : ctx.url?.pathname?.includes("/stamps/")
    ? "stamps"
    : "all";

  try {
    const blockInfo = await BlockService.getBlockInfo(blockIdentifier, type);
    const response = BlockService.transformToBlockInfoResponse(blockInfo);
    return ResponseUtil.success(response);
  } catch (error) {
    console.error(`Error in ${type}/block handler:`, error);
    const body: ErrorResponseBody = {
      error: error instanceof Error &&
          error.message === "Could not connect to database"
        ? "Database connection error"
        : `Block: ${block_index} not found`,
    };
    return ResponseUtil.error(
      body.error,
      error instanceof Error &&
        error.message === "Could not connect to database"
        ? 500
        : 404,
    );
  }
};
