import { Handlers } from "$fresh/server.ts";
import { BlockService } from "$lib/services/blockService.ts";
import { ResponseUtil } from "utils/responseUtil.ts";
import { isIntOr32ByteHex } from "$lib/utils/util.ts";
import { BlockHandlerContext, ErrorResponseBody } from "globals";

export const handler: Handlers<BlockHandlerContext> = {
  async GET(req, ctx) {
    const { block_index } = ctx.params;

    if (!isIntOr32ByteHex(block_index)) {
      return ResponseUtil.error(
        `Invalid input: ${block_index}. It must be a valid block index (integer) or block hash (64 character string).`,
        400,
      );
    }

    const blockIdentifier = /^\d+$/.test(block_index)
      ? Number(block_index)
      : block_index;
    const type = new URL(req.url).pathname.includes("/cursed/")
      ? "cursed"
      : new URL(req.url).pathname.includes("/stamps/")
      ? "stamps"
      : "all";

    try {
      const blockInfo = await BlockService.getBlockInfoWithStamps(
        blockIdentifier,
        type,
      );
      const response = BlockService.transformToBlockInfoResponse(blockInfo);
      return ResponseUtil.success(response);
    } catch (error) {
      console.error(`Error in ${type}/block handler:`, error);
      const errorMessage = error instanceof Error &&
          error.message === "Could not connect to database"
        ? "Database connection error"
        : `Block: ${block_index} not found`;
      const statusCode = error instanceof Error &&
          error.message === "Could not connect to database"
        ? 500
        : 404;
      return ResponseUtil.error(errorMessage, statusCode);
    }
  },
};
