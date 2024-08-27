import { Handlers } from "$fresh/server.ts";
import { StampController } from "$lib/controller/stampController.ts";
import { PROTOCOL_IDENTIFIERS } from "$lib/utils/protocol.ts";
import { IdentHandlerContext, PaginatedStampResponseBody } from "globals";
import { ResponseUtil } from "utils/responseUtil.ts";
import { getPaginationParams } from "$lib/utils/paginationUtils.ts";

export const handler: Handlers<IdentHandlerContext> = {
  async GET(req, ctx) {
    const { ident } = ctx.params;
    if (!PROTOCOL_IDENTIFIERS.includes(ident.toUpperCase())) {
      return ResponseUtil.error(
        `Error: ident: ${ident} not found, use ${PROTOCOL_IDENTIFIERS}`,
        404,
      );
    }

    const url = new URL(req.url);
    const { limit, page } = getPaginationParams(url);
    const sort = (url.searchParams.get("sort") as "asc" | "desc") ||
      "asc";

    try {
      const result = await StampController.getStamps({
        page,
        limit,
        orderBy: sort.toUpperCase(),
        type: "stamps",
        ident: [ident.toUpperCase()],
        allColumns: true,
      });

      const body: PaginatedStampResponseBody = {
        ...result,
        data: result.data,
      };

      return ResponseUtil.success(body);
    } catch (error) {
      console.error(`Error in stamps/ident handler:`, error);
      return ResponseUtil.handleError(
        error,
        `Error: stamps with ident: ${ident} not found`,
      );
    }
  },
};

export const config = {
  api: {
    bodyParser: {
      sizeLimit: "1mb",
    },
  },
};
