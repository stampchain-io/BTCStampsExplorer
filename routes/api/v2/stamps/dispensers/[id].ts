import { Handlers } from "$fresh/server.ts";
import { DispenserResponseBody, DispenserRow, IdHandlerContext } from "globals";
import { ResponseUtil } from "utils/responseUtil.ts";
import { BlockService } from "$lib/services/blockService.ts";
import { DispenserManager } from "$lib/services/xcpService.ts";

export const handler: Handlers<IdHandlerContext> = {
  async GET(req, ctx) {
    const { id } = ctx.params;
    const url = new URL(req.url);
    const filter =
      url.searchParams.get("filter") as "open" | "closed" | "all" || "open";

    try {
      const [dispensers, lastBlock] = await Promise.all([
        DispenserManager.getDispensersByCpid(id, filter),
        BlockService.getLastBlock(),
      ]);

      if (!dispensers || dispensers.length === 0) {
        return ResponseUtil.error("No dispensers found", 404);
      }

      const mappedDispensers = await Promise.all(
        dispensers.map(async (dispenser: DispenserRow) => ({
          ...dispenser,
          dispenses: await DispenserManager.getDispensesByCpid(dispenser.cpid),
        })),
      );

      const body: DispenserResponseBody = {
        dispensers: mappedDispensers,
        last_block: lastBlock.last_block,
      };

      return ResponseUtil.success(body);
    } catch (error) {
      console.error("Error in dispensers handler:", error);
      return ResponseUtil.handleError(error, "Error processing request");
    }
  },
};
