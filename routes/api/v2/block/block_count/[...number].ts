import { BlockRepository } from "$lib/database/index.ts";
import { ResponseUtil } from "utils/responseUtil.ts";
// import { getPaginationParams } from "$lib/utils/paginationUtils.ts";
import { withDatabaseClient } from "$lib/services/databaseService.ts";
import { BlockCountHandlerContext, PaginatedRequest } from "globals";

export const handler = async (
  _req: PaginatedRequest,
  ctx: BlockCountHandlerContext,
): Promise<Response> => {
  try {
    const { number } = ctx.params;
    const parsedNumber = number ? parseInt(number) : 100;

    if (Number.isNaN(parsedNumber) || parsedNumber < 1 || parsedNumber > 100) {
      return ResponseUtil.error(
        "Invalid number provided. Must be a number between 1 and 100.",
        400,
      );
    }

    const lastBlocks = await withDatabaseClient((client) => {
      return BlockRepository.get_last_x_blocks_with_client(
        parsedNumber,
      );
    });

    return ResponseUtil.successArray(lastBlocks);
  } catch (error) {
    console.error("Failed to get last blocks:", error);
    return ResponseUtil.error("Internal server error", 500);
  }
};
