import { Handlers } from "$fresh/server.ts";
import { CollectionController } from "$lib/controller/collectionController.ts";
import { ResponseUtil } from "utils/responseUtil.ts";
import { getPaginationParams } from "utils/paginationUtils.ts";

export const handler: Handlers = {
  async GET(req) {
    const url = new URL(req.url);
    const { limit, page } = getPaginationParams(url);
    const creator = url.searchParams.get("creator");

    try {
      const result = await CollectionController.getCollections({
        limit,
        page,
        creator: creator || undefined,
      });
      return ResponseUtil.success(result);
    } catch (error) {
      return ResponseUtil.handleError(error, "Error processing request");
    }
  },
};
