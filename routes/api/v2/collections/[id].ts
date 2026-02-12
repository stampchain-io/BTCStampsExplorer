import { Handlers } from "$fresh/server.ts";
import { ApiResponseUtil } from "$lib/utils/api/responses/apiResponseUtil.ts";
import { getPaginationParams } from "$lib/utils/data/pagination/paginationUtils.ts";
import { CollectionController } from "$server/controller/collectionController.ts";
import { CollectionService } from "$server/services/core/collectionService.ts";
import { RouteType } from "$server/services/infrastructure/cacheService.ts";

/**
 * Collection Detail Endpoint
 * Route: /api/v2/collections/[id]
 *
 * Accepts either a collection name (e.g., "KEVIN") or a hex UUID (32 hex chars).
 * Returns detailed information including:
 * - Basic collection information (name, description, creators)
 * - Stamps array (paginated)
 * - Market data from collection_market_data table
 *
 * Query Parameters:
 * - limit: Number of stamps to return per page (default: 50)
 * - page: Page number for pagination (default: 1)
 * - includeMarketData: Whether to include market data (default: true)
 */
export const handler: Handlers = {
  async GET(req, ctx) {
    try {
      const { id } = ctx.params;

      if (!id) {
        return ApiResponseUtil.badRequest("Collection ID or name is required");
      }

      // Determine if input is a hex UUID or a collection name
      const cleanedId = id.replace(/-/g, "");
      const isHexId = /^[0-9a-fA-F]{32}$/.test(cleanedId);

      let collectionId: string;

      if (isHexId) {
        collectionId = cleanedId;
      } else {
        // Look up collection by name to get its hex UUID
        const byName = await CollectionService.getCollectionByName(id);
        if (!byName) {
          return ApiResponseUtil.notFound("Collection not found");
        }
        collectionId = byName.collection_id;
      }

      const url = new URL(req.url);
      const pagination = getPaginationParams(url);

      // Check if pagination validation failed
      if (pagination instanceof Response) {
        return pagination;
      }

      const { limit, page } = pagination;

      // Get includeMarketData parameter (default: true)
      const includeMarketDataParam = url.searchParams.get("includeMarketData");
      const includeMarketData = includeMarketDataParam === null
        ? true
        : includeMarketDataParam === "true";

      // Fetch collection by ID (with market data, stamps, etc.)
      const collection = await CollectionController.getCollectionById(
        collectionId,
        {
          includeMarketData,
          stampLimit: limit || 50,
          stampPage: page || 1,
        },
      );

      if (!collection) {
        return ApiResponseUtil.notFound("Collection not found");
      }

      // Return collection data
      return ApiResponseUtil.success(collection, {
        routeType: RouteType.COLLECTION,
      });
    } catch (error) {
      console.error("Error in collection handler:", error);
      return ApiResponseUtil.internalError(
        error,
        "Error processing collection request",
      );
    }
  },
};
