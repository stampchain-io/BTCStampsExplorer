import { Handlers } from "$fresh/server.ts";
import { ApiResponseUtil } from "$lib/utils/apiResponseUtil.ts";
import { SRC20Service } from "$server/services/src20/index.ts";

export const handler: Handlers = {
  async GET(req) {
    try {
      const url = new URL(req.url);
      const query = url.searchParams.get("q") || "";

      const results = await SRC20Service.QueryService.searchSrc20Data(query);

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
