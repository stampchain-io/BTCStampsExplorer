import { Handlers } from "$fresh/server.ts";
import { Src20Controller } from "$server/controller/src20Controller.ts";
import { ApiResponseUtil } from "$lib/utils/apiResponseUtil.ts";

export const handler: Handlers = {
  async GET(req) {
    try {
      const url = new URL(req.url);
      const query = url.searchParams.get("q") || "";

      const results = await Src20Controller.handleSearchRequest(query);

      return ApiResponseUtil.success({ data: results });
    } catch (error) {
      console.error("Error in search handler:", error);
      return ApiResponseUtil.internalError(
        error,
        "Error processing search request",
      );
    }
  },
};
