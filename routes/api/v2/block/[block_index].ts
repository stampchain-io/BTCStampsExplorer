import { Handlers } from "$fresh/server.ts";
import { BlockService } from "$lib/services/blockService.ts";
import { ResponseUtil } from "utils/responseUtil.ts";
import { isIntOr32ByteHex } from "$lib/utils/util.ts";
import { BlockHandlerContext } from "globals";

export const handler: Handlers<BlockHandlerContext> = {
  async GET(req, ctx) {
    try {
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
      const url = new URL(req.url);
      const type = url.pathname.includes("/cursed/")
        ? "cursed"
        : url.pathname.includes("/stamps/")
        ? "stamps"
        : "all";

      const blockInfo = await BlockService.getBlockInfoWithStamps(
        blockIdentifier,
        type,
      );
      const response = BlockService.transformToBlockInfoResponse(blockInfo);
      return ResponseUtil.success(response);
    } catch (error) {
      console.error(`Error in block handler:`, error);
      return ResponseUtil.handleError(error, "Error processing block request");
    }
  },
};
