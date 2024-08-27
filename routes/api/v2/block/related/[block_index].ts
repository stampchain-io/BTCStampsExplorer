import { Handlers } from "$fresh/server.ts";
import { BlockService } from "$lib/services/blockService.ts";
import { isIntOr32ByteHex } from "$lib/utils/util.ts";
import { BlockHandlerContext, ErrorResponseBody } from "globals";
import { ResponseUtil } from "utils/responseUtil.ts";

export const handler: Handlers<BlockHandlerContext> = {
  async GET(req, ctx) {
    const blockIdentifier = ctx.params.block_index;

    if (!isIntOr32ByteHex(blockIdentifier)) {
      const body: ErrorResponseBody = {
        error:
          "Invalid argument provided. Must be an integer or 32 byte hex string.",
      };
      return ResponseUtil.error(body.error, 400);
    }

    const isStamps = req.url.includes("/stamps/");
    const type = isStamps ? "stamps" : "cursed";

    try {
      const blockInfo = await BlockService.getBlockInfoWithStamps(
        blockIdentifier,
        type,
      );
      const response = BlockService.transformToBlockInfoResponse(blockInfo);
      return ResponseUtil.success(response);
    } catch (error) {
      console.error(`Error in ${type}/block handler:`, error);
      const body: ErrorResponseBody = {
        error: `Block: ${blockIdentifier} not found`,
      };
      return ResponseUtil.error(body.error, 404);
    }
  },
};
