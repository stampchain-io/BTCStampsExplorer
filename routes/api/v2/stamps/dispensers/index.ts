import { Handlers } from "$fresh/server.ts";
// import { paginate } from "$lib/utils/util.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
// import { getPaginationParams } from "$lib/utils/paginationUtils.ts";
// import { BlockController } from "$lib/controller/blockController.ts";
// import { DispenserManager } from "$server/services/xcpService.ts";

export const handler: Handlers = {
  async GET(req) {
    try {
      // const url = new URL(req.url);
      // const { limit, page } = getPaginationParams(url);

      // const [lastBlock, { total, dispensers }] = await Promise.all([
      //   BlockController.getLastBlock(),
      //   DispenserManager.getAllOpenStampDispensers(page, limit),
      // ]);

      const body = {
        message: "Pending implementation",
      };

      return ResponseUtil.success(body);
    } catch (error) {
      console.error("Error in dispensers handler:", error);
      return ResponseUtil.handleError(error, "Error processing request");
    }
  },
};
