import { StampController } from "$lib/controller/stampController.ts";
import { PROTOCOL_IDENTIFIERS } from "$lib/utils/protocol.ts";
import { IdentHandlerContext, PaginatedStampResponseBody } from "globals";
import { ResponseUtil } from "utils/responseUtil.ts";
import { getPaginationParams } from "$lib/utils/paginationUtils.ts";

export const handler = async (
  req: Request,
  ctx: IdentHandlerContext,
): Promise<Response> => {
  const { ident } = ctx.params;
  if (!PROTOCOL_IDENTIFIERS.includes(ident.toUpperCase())) {
    return ResponseUtil.error(
      `Error: ident: ${ident} not found, use ${PROTOCOL_IDENTIFIERS}`,
      404,
    );
  }

  const url = new URL(req.url);
  const { limit, page } = getPaginationParams(url);
  const sort_order = (url.searchParams.get("sort_order") as "asc" | "desc") ||
    "asc";

  try {
    const result = await StampController.getStamps({
      page,
      limit,
      orderBy: sort_order.toUpperCase(),
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
    console.error("Error:", error);
    return ResponseUtil.error(
      `Error: stamps with ident: ${ident} not found`,
      500,
    );
  }
};
