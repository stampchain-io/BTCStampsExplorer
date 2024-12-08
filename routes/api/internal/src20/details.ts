import { Handlers } from "$fresh/server.ts";
import { Src20Controller } from "$server/controller/src20Controller.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { RouteType } from "$server/services/cacheService.ts";

export const handler: Handlers = {
  async GET(req) {
    try {
      const url = new URL(req.url);
      const limit = parseInt(url.searchParams.get("limit") || "5");
      const page = parseInt(url.searchParams.get("page") || "1");
      const op = url.searchParams.get("op") || "DEPLOY";
      const sortBy = url.searchParams.get("sortBy") || "ASC";

      const src20Data = await Src20Controller.fetchSrc20DetailsWithHolders(
        null,
        {
          op,
          page,
          limit,
          sortBy,
        },
      );

      return ResponseUtil.success(src20Data, {
        routeType: RouteType.DYNAMIC,
      });
    } catch (error) {
      return ResponseUtil.internalError(
        error,
        "Error fetching SRC20 details",
      );
    }
  },
};
