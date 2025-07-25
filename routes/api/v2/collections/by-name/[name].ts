import { Handlers } from "$fresh/server.ts";
import { ApiResponseUtil } from "$lib/utils/apiResponseUtil.ts";
import { RouteType } from "$server/services/infrastructure/cacheService.ts";
import { CollectionService } from "$server/services/core/collectionService.ts";

export const handler: Handlers = {
  async GET(_req, ctx) {
    try {
      const { name } = ctx.params;

      if (!name) {
        return ApiResponseUtil.badRequest("Collection name is required");
      }

      const collection = await CollectionService.getCollectionByName(name);

      if (!collection) {
        return ApiResponseUtil.notFound("Collection not found");
      }

      return ApiResponseUtil.success(collection, {
        routeType: RouteType.COLLECTION,
      });
    } catch (error) {
      console.error("Error in collection by-name handler:", error);
      return ApiResponseUtil.internalError(
        error,
        "Error processing collection request",
      );
    }
  },
};
