import { Handlers } from "$fresh/server.ts";
import { ApiResponseUtil } from "$lib/utils/api/responses/apiResponseUtil.ts";
import { getPaginationParams } from "$lib/utils/data/pagination/paginationUtils.ts";
import { CollectionController } from "$server/controller/collectionController.ts";
import { RouteType } from "$server/services/infrastructure/cacheService.ts";

/**
 * Collection Detail Endpoint
 * Route: /api/v2/collections/[id]
 *
 * Returns detailed information for a specific collection by ID, including:
 * - Basic collection information (name, description, creators)
 * - Stamps array (paginated)
 * - Market data from collection_market_data table
 *
 * Query Parameters:
 * - limit: Number of stamps to return per page (default: 50)
 * - page: Page number for pagination (default: 1)
 * - includeMarketData: Whether to include market data (default: true)
 *
 * Note: Collection ID must be a valid UUID (32 hex characters).
 * The UUID is converted to BINARY(16) using UNHEX() for database queries.
 */
export const handler: Handlers = {
  async GET(req, ctx) {
    try {
      const { id } = ctx.params;

      // Validate collection ID format (should be 32 hex characters)
      if (!id) {
        return ApiResponseUtil.badRequest("Collection ID is required");
      }

      // Remove hyphens if UUID format with hyphens (e.g., "550e8400-e29b-41d4-a716-446655440000")
      const cleanedId = id.replace(/-/g, "");

      // Validate hex format and length
      if (!/^[0-9a-fA-F]{32}$/.test(cleanedId)) {
        return ApiResponseUtil.badRequest(
          "Invalid collection ID format. Expected 32 hexadecimal characters.",
        );
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

      // Fetch collection by ID
      const collection = await CollectionController.getCollectionById(
        cleanedId,
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
      console.error("Error in collection by-id handler:", error);
      return ApiResponseUtil.internalError(
        error,
        "Error processing collection request",
      );
    }
  },
};
