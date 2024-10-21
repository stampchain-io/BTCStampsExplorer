import { Handlers } from "$fresh/server.ts";
import { CollectionController } from "$lib/controller/collectionController.ts";
import { ResponseUtil } from "utils/responseUtil.ts";
import { getPaginationParams } from "utils/paginationUtils.ts";

export const handler: Handlers = {
  async GET(req) {
    try {
      const url = new URL(req.url);
      const { limit, page } = getPaginationParams(url);
      const creator = url.searchParams.get("creator") ?? undefined;

      const result = await CollectionController.getCollections({
        limit,
        page,
        creator,
      });

      return ResponseUtil.success(result);
    } catch (error) {
      console.error("Error in GET handler:", error);
      return ResponseUtil.handleError(error, "Error processing collections request");
    }
  },
};
