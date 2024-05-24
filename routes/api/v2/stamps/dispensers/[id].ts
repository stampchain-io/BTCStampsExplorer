import { DispenserResponseBody, IdHandlerContext } from "globals";
import { get_dispensers } from "utils/xcp.ts";
import { CommonClass, getClient } from "$lib/database/index.ts";
import { ResponseUtil } from "utils/responseUtil.ts";

export const handler = async (
  _req: Request,
  ctx: IdHandlerContext,
): Promise<Response> => {
  const { id } = ctx.params;
  try {
    const dispensers = await get_dispensers(id);
    const client = await getClient();
    const last_block = await CommonClass.get_last_block_with_client(client);

    if (!dispensers || dispensers.length === 0) {
      return ResponseUtil.error("No dispensers found", 404);
    }

    const body: DispenserResponseBody = {
      dispensers: dispensers[0],
      last_block: last_block.rows[0].last_block,
    };

    return ResponseUtil.success(body);
  } catch (error) {
    console.error("Error:", error);
    return ResponseUtil.error("Internal server error", 500);
  }
};
