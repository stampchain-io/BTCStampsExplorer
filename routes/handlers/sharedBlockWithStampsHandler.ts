import { BlockService } from "$lib/services/blockService.ts";
import { BlockHandlerContext, ErrorResponseBody } from "globals";
import { ResponseUtil } from "utils/responseUtil.ts";

export const sharedBlockWithStampsHandler = async (
  _req: Request,
  ctx: BlockHandlerContext,
): Promise<Response> => {
  let { block_index } = ctx.params;
  let blockIdentifier: number | string;

  // If no block_index is provided, fetch the latest block
  if (!block_index) {
    try {
      const lastBlock = await BlockService.getLastBlock();
      block_index = lastBlock.last_block.toString();
    } catch (error) {
      console.error("Error fetching last block:", error);
      return ResponseUtil.error("Failed to fetch the latest block", 500);
    }
  }

  // Check if the input is a valid block index (number) or a block hash (string)
  if (/^\d+$/.test(block_index)) {
    blockIdentifier = Number(block_index);
  } else if (typeof block_index === "string" && block_index.length === 64) {
    blockIdentifier = block_index;
  } else {
    const body: ErrorResponseBody = {
      error:
        `Invalid input: ${block_index}. It must be a valid block index (integer) or block hash (64 character string).`,
    };
    return ResponseUtil.error(body.error, 400);
  }

  const isStamps = ctx.url.pathname.includes("/stamps/");
  const type = isStamps ? "stamps" : "cursed";

  try {
    const body = await BlockService.getBlockInfoWithStamps(
      blockIdentifier,
      type,
    );
    return ResponseUtil.success(body);
  } catch (error) {
    console.error(`Error in ${type}/block handler:`, error);
    const body: ErrorResponseBody = {
      error: `Block: ${block_index} not found`,
    };
    return ResponseUtil.error(body.error, 404);
  }
};
