import { Handlers } from "$fresh/server.ts";
import { StampRepository } from "$lib/database/index.ts";
import { paginate } from "$lib/utils/util.ts";
import { PaginatedStampResponseBody } from "globals";
import { ResponseUtil } from "utils/responseUtil.ts";
import { getPaginationParams } from "utils/paginationUtils.ts";
import { BlockService } from "$lib/services/blockService.ts";
import { StampController } from "$lib/controller/stampController.ts";

export const createSharedStampIndexHandler = (
  stampType: "stamps" | "cursed",
): Handlers => ({
  async GET(req: Request, _ctx) {
    try {
      const url = new URL(req.url);
      const { limit, page } = getPaginationParams(url);
      const sort_order =
        (url.searchParams.get("sort_order") as "asc" | "desc") || "asc";

      const [data, totalResult, lastBlock] = await Promise.all([
        StampRepository.getStampsFromDb({
          limit,
          page,
          sort_order,
          type: stampType,
          all_columns: true,
        }),
        StampRepository.getTotalStampCountFromDb(stampType),
        BlockService.getLastBlock(),
      ]);

      const total = totalResult.rows[0]["total"];
      const pagination = paginate(total, page, limit);

      const body = {
        ...pagination,
        last_block: lastBlock.last_block || lastBlock,
        data: data.rows,
      } as PaginatedStampResponseBody;

      return ResponseUtil.success(body);
    } catch (error) {
      console.error(`Error fetching paginated ${stampType}: ${error.message}`);
      return ResponseUtil.error(`Error: Internal server error`, 500);
    }
  },
});

export const sharedStampIdHandler: Handlers = {
  async GET(_req: Request, ctx) {
    try {
      const { id } = ctx.params;
      const stampData = await StampController.getStampDetailsById(id);
      if (!stampData) {
        return ResponseUtil.error("Stamp not found", 404);
      }
      return ResponseUtil.success({
        data: stampData.data,
        last_block: stampData.last_block, // TODO: Add type checking
      });
    } catch (error) {
      console.error("Error fetching stamp data:", error);
      return ResponseUtil.error("Internal server error", 500);
    }
  },
};
