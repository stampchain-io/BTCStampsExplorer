import { Handlers } from "$fresh/server.ts";
import { CollectionController } from "$server/controller/collectionController.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { getPaginationParams } from "$lib/utils/paginationUtils.ts";
import {
  checkEmptyResult,
  DEFAULT_PAGINATION,
} from "$server/services/routeValidationService.ts";
import { RouteType } from "$server/services/cacheService.ts";

export const handler: Handlers = {
  async GET(req, ctx) {
    try {
      const url = new URL(req.url);
      const pagination = getPaginationParams(url);
      const { creator } = ctx.params;

      // Check if pagination validation failed
      if (pagination instanceof Response) {
        return pagination;
      }

      const { limit, page } = pagination;

      const result = await CollectionController.getCollectionDetails({
        limit: limit || DEFAULT_PAGINATION.limit,
        page: page || DEFAULT_PAGINATION.page,
        creator,
      });

      // Check for empty result
      const emptyCheck = checkEmptyResult(result, "collection data");
      if (emptyCheck) {
        return emptyCheck;
      }

      return ResponseUtil.success(result, { routeType: RouteType.COLLECTION });
    } catch (error) {
      console.error("Error in GET handler:", error);
      return ResponseUtil.internalError(
        error,
        "Error processing collections request",
      );
    }
  },
};
