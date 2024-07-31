import { Handlers } from "$fresh/server.ts";
import { paginate } from "$lib/utils/util.ts";
import { get_all_dispensers } from "$lib/utils/xcp.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { getPaginationParams } from "$lib/utils/paginationUtils.ts";
import { BlockService } from "$lib/services/blockService.ts";

export const handler: Handlers = {
  async GET(req) {
    try {
      const url = new URL(req.url);
      const { limit, page } = getPaginationParams(url);

      const [lastBlock, { total, dispensers }] = await Promise.all([
        BlockService.getLastBlock(),
        get_all_dispensers(page, limit),
      ]);

      const body = {
        ...paginate(total, page, limit),
        last_block: lastBlock.last_block,
        dispensers,
      };

      return ResponseUtil.success(body);
    } catch (error) {
      console.error("Error:", error);
      return ResponseUtil.error("Internal server error", 500);
    }
  },
};
