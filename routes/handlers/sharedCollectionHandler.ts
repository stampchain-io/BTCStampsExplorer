import type { SUBPROTOCOLS } from "$types/base.d.ts";
import type {
  ColumnDefinition,
  FeeAlert,
  InputData,
  MockResponse,
  NamespaceImport,
  ProtocolComplianceLevel,
  ToolEstimationParams,
  XcpBalance,
} from "$types/toolEndpointAdapter.ts";
import { Handlers } from "$fresh/server.ts";
import { ApiResponseUtil } from "$lib/utils/api/responses/apiResponseUtil.ts";
import { CollectionService } from "$server/services/core/collectionService.ts";

const collectionHandler: Handlers = {
  async GET(req: Request, _ctx) {
    try {
      const url = new URL(req.url);
      const collectionName = url.searchParams.get("name");

      if (!collectionName) {
        return ApiResponseUtil.badRequest("Collection name is required");
      }

      const collection = await CollectionService.getCollectionByName(
        collectionName,
      );

      if (!collection) {
        return ApiResponseUtil.notFound("Collection not found");
      }

      return ApiResponseUtil.success({ data: collection });
    } catch (error) {
      return ApiResponseUtil.internalError(error, "Error fetching collection");
    }
  },
};

export const handler = collectionHandler;
