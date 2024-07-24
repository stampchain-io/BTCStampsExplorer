import { PaginatedDispenserResponseBody, PaginatedRequest } from "globals";
import { paginate } from "$lib/utils/util.ts";
import { get_all_dispensers } from "$lib/utils/xcp.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { getPaginationParams } from "$lib/utils/paginationUtils.ts";
import { withDatabaseClient } from "$lib/services/databaseService.ts";
import { BlockService } from "$lib/services/blockService.ts";

export const handler = async (
  req: PaginatedRequest,
): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const { limit, page } = getPaginationParams(url);

    const body = await withDatabaseClient(async (client) => {
      const lastBlock = await BlockService.getLastBlock();
      const { total, dispensers } = await get_all_dispensers(page, limit);
      const pagination = paginate(total, page, limit);

      return {
        ...pagination,
        last_block: lastBlock.last_block,
        dispensers,
      } as PaginatedDispenserResponseBody;
    });

    return ResponseUtil.success(body);
  } catch (error) {
    console.error("Error:", error);
    return ResponseUtil.error("Error: Internal server error", 500);
  }
};
