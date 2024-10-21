import { Handlers } from "$fresh/server.ts";
import { CollectionService } from "$lib/services/collectionService.ts";
import { ResponseUtil } from "utils/responseUtil.ts";

export const collectionHandler: Handlers = {
  async GET(req: Request, _ctx) {
    try {
      const url = new URL(req.url);
      const collectionName = url.searchParams.get("name");

      if (!collectionName) {
        return ResponseUtil.error("Collection name is required", 400);
      }

      const collection = await CollectionService.getCollectionByName(
        collectionName,
      );

      if (!collection) {
        return ResponseUtil.error("Collection not found", 404);
      }

      return ResponseUtil.success({ data: collection });
    } catch (error) {
      console.error(`Error fetching collection: ${error.message}`);
      return ResponseUtil.error("Internal server error", 500);
    }
  },
};
