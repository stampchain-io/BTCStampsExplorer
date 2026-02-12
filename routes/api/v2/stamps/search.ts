import { Handlers } from "$fresh/server.ts";
import { ApiResponseUtil } from "$lib/utils/api/responses/apiResponseUtil.ts";
import {
  classifySearchInput,
} from "$lib/utils/data/search/searchInputClassifier.ts";
import { StampService } from "$server/services/stampService.ts";

export const handler: Handlers = {
  async GET(req) {
    try {
      const url = new URL(req.url);
      const query = url.searchParams.get("q") || "";

      if (!query.trim()) {
        return ApiResponseUtil.success({ data: [] });
      }

      const { type, sanitized } = classifySearchInput(query);

      // deno-lint-ignore no-explicit-any
      const queryOptions: Record<string, any> = {
        limit: 10,
        noPagination: true,
        skipTotalCount: true,
        selectColumns: [
          "stamp",
          "cpid",
          "stamp_url",
          "stamp_mimetype",
          "creator",
          "tx_hash",
        ],
      };

      switch (type) {
        case "cpid":
        case "tx_hash":
          queryOptions.identifier = sanitized;
          break;

        case "stamp_number":
          queryOptions.identifier = parseInt(sanitized);
          break;

        case "address":
          queryOptions.creatorAddress = sanitized;
          queryOptions.sortBy = "DESC";
          break;

        case "ticker":
        case "unknown":
        default:
          // Generic LIKE search on cpid, creator, tx_hash
          queryOptions.search = sanitized;
          break;
      }

      const results = await StampService.getStamps(queryOptions);

      // Format for dropdown display
      // deno-lint-ignore no-explicit-any
      const formattedResults = ((results as any)?.data || []).map(
        // deno-lint-ignore no-explicit-any
        (stamp: any) => ({
          stamp: stamp.stamp,
          cpid: stamp.cpid,
          preview: stamp.stamp_url,
          mimetype: stamp.stamp_mimetype,
          creator: stamp.creator,
          tx_hash: stamp.tx_hash,
        }),
      );

      return ApiResponseUtil.success({ data: formattedResults });
    } catch (error) {
      console.error("Error in stamp search handler:", error);
      return ApiResponseUtil.internalError(
        error,
        "Error processing stamp search",
      );
    }
  },
};
