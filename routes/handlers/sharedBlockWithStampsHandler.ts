import { Handlers } from "$fresh/server.ts";
import { BlockService } from "$lib/services/blockService.ts";
import { BlockHandlerContext } from "globals";
import { ResponseUtil } from "utils/responseUtil.ts";
import { isIntOr32ByteHex } from "$lib/utils/util.ts";

export const sharedBlockWithStampsHandler: Handlers<BlockHandlerContext> = {
  async GET(_req, ctx) {
    let { block_index } = ctx.params;
    let blockIdentifier: number | string;

    if (!block_index) {
      try {
        const lastBlock = await BlockService.getLastBlock();
        block_index = lastBlock.last_block.toString();
      } catch (error) {
        console.error("Error fetching last block:", error);
        return ResponseUtil.error("Failed to fetch the latest block", 500);
      }
    }

    if (!isIntOr32ByteHex(block_index)) {
      return ResponseUtil.error(
        `Invalid input: ${block_index}. It must be a valid block index (integer) or block hash (64 character string).`,
        400,
      );
    }

    blockIdentifier = /^\d+$/.test(block_index)
      ? Number(block_index)
      : block_index;
    const type = ctx.url.pathname.includes("/stamps/") ? "stamps" : "cursed";

    try {
      const response = await BlockService.getBlockInfoWithStamps(
        blockIdentifier,
        type,
      );
      // const response = BlockService.transformToBlockInfoResponse(blockInfo);
      return ResponseUtil.success(response);
    } catch (error) {
      console.error(`Error in ${type}/block handler:`, error);
      return ResponseUtil.error(`Block: ${block_index} not found`, 404);
    }
  },
};
