import { DispenserResponseBody, DispenserRow, IdHandlerContext } from "globals";
import { ResponseUtil } from "utils/responseUtil.ts";
import { BlockService } from "$lib/services/blockService.ts";
import { DispenserManager } from "$lib/services/xcpService.ts";

export const handler = async (
  req: Request,
  ctx: IdHandlerContext,
): Promise<Response> => {
  const { id } = ctx.params;
  const url = new URL(req.url);
  const filter = url.searchParams.get("filter") as "open" | "closed" | "all" ||
    "open";

  try {
    const dispensers = await DispenserManager.getDispensersByCpid(id, filter);
    const lastBlock = await BlockService.getLastBlock();

    if (!dispensers || dispensers.length === 0) {
      return ResponseUtil.error("No dispensers found", 404);
    }

    // Fetch dispenses for each dispenser
    const mappedDispensers = await Promise.all(
      dispensers.map(async (dispenser: DispenserRow) => {
        const dispenses = await DispenserManager.getDispensesByCpid(
          dispenser.cpid,
        );
        return {
          ...dispenser,
          dispenses,
        };
      }),
    );

    const body: DispenserResponseBody = {
      dispensers: mappedDispensers,
      last_block: lastBlock.last_block,
    };

    return ResponseUtil.success(body);
  } catch (error) {
    console.error("Error:", error);
    return ResponseUtil.error("Internal server error", 500);
  }
};
