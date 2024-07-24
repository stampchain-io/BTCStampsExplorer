import { DispenserResponseBody, DispenserRow, IdHandlerContext } from "globals";
import { get_dispensers, get_dispenses } from "utils/xcp.ts";
import { ResponseUtil } from "utils/responseUtil.ts";
import { BlockService } from "$lib/services/blockService.ts";

export const handler = async (
  _req: Request,
  ctx: IdHandlerContext,
): Promise<Response> => {
  const { id } = ctx.params;
  try {
    const dispensers = await get_dispensers(id);
    const lastBlock = await BlockService.getLastBlock();

    if (!dispensers || dispensers.length === 0) {
      return ResponseUtil.error("No dispensers found", 404);
    }

    // Fetch dispenses for each dispenser
    const mappedDispensers = await Promise.all(
      dispensers.map(async (dispenser: DispenserRow) => {
        const dispenses = await get_dispenses(dispenser.cpid);
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
