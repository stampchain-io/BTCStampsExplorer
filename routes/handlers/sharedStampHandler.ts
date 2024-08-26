import { Handlers } from "$fresh/server.ts";
import { StampController } from "$lib/controller/stampController.ts";
import { ResponseUtil } from "utils/responseUtil.ts";
import { getPaginationParams } from "utils/paginationUtils.ts";
import { BlockService } from "$lib/services/blockService.ts";

// Add this function to handle BigInt serialization
function bigIntSerializer(key: string, value: any) {
  if (typeof value === "bigint") {
    return value.toString();
  }
  return value;
}

export const sharedStampIndexHandler = (
  stampType: "stamps" | "cursed",
): Handlers => ({
  async GET(req: Request, _ctx) {
    try {
      const url = new URL(req.url);
      const { limit, page } = getPaginationParams(url);
      const sort_order =
        (url.searchParams.get("sort_order")?.toUpperCase() as "ASC" | "DESC") ||
        "ASC";

      const result = await StampController.getStamps({
        page,
        limit,
        orderBy: sort_order.toUpperCase(),
        type: stampType,
        all_columns: true,
      });

      return ResponseUtil.success(
        JSON.parse(JSON.stringify(result, bigIntSerializer)),
      );
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
