import { Handlers } from "$fresh/server.ts";
import { CollectionController } from "$server/controller/collectionController.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { getPaginationParams } from "$lib/utils/paginationUtils.ts";

export const handler: Handlers = {
  async GET(req) {
    try {
      const url = new URL(req.url);
      const { limit, page } = getPaginationParams(url);
      const creator = url.searchParams.get("creator") ?? undefined;

      const result = await CollectionController.getCollectionDetails({
        limit,
        page,
        creator,
      });

      return ResponseUtil.success(result);
    } catch (error) {
      console.error("Error in GET handler:", error);
      return ResponseUtil.handleError(
        error,
        "Error processing collections request",
      );
    }
  },
};
