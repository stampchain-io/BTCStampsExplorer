import { Handlers } from "$fresh/server.ts";
import { CollectionService } from "$server/services/collectionService.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";

export const collectionHandler: Handlers = {
  async GET(req: Request, _ctx) {
    try {
      const url = new URL(req.url);
      const collectionName = url.searchParams.get("name");

      if (!collectionName) {
        return ResponseUtil.badRequest("Collection name is required", 400);
      }

      const collection = await CollectionService.getCollectionByName(
        collectionName,
      );

      if (!collection) {
        return ResponseUtil.notFound("Collection not found");
      }

      return ResponseUtil.success({ data: collection });
    } catch (error) {
      return ResponseUtil.internalError(error, "Error fetching collection");
    }
  },
};
