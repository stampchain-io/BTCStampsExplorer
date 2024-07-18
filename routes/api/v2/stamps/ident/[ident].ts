import { withDatabaseClient } from "$lib/services/databaseService.ts";
import { CommonClass, StampsClass } from "$lib/database/index.ts";
import { PROTOCOL_IDENTIFIERS } from "$lib/utils/protocol.ts";
import { IdentHandlerContext, PaginatedStampResponseBody } from "globals";
import { ResponseUtil } from "utils/responseUtil.ts";
import { getPaginationParams } from "$lib/utils/paginationUtils.ts";
import { paginate } from "$lib/utils/util.ts";

export const handler = async (
  req: Request,
  ctx: IdentHandlerContext,
): Promise<Response> => {
  const { ident } = ctx.params;
  if (!PROTOCOL_IDENTIFIERS.includes(ident.toUpperCase())) {
    return ResponseUtil.error(`Error: ident: ${ident} not found`, 404);
  }

  const url = new URL(req.url);
  const { limit, page } = getPaginationParams(url);
  const sort_order = (url.searchParams.get("sort_order") as "asc" | "desc") ||
    "asc";

  try {
    return await withDatabaseClient(async (client) => {
      const [data, totalResult, lastBlock] = await Promise.all([
        StampsClass.get_stamps(client, {
          limit,
          page,
          sort_order,
          type: "stamps",
          ident: ident.toUpperCase(),
          all_columns: true,
        }),
        StampsClass.get_total_stamp_count(
          client,
          "stamps",
          ident.toUpperCase(),
        ),
        CommonClass.get_last_block_with_client(client),
      ]);

      const total = totalResult.rows[0]["total"];
      const pagination = paginate(total, page, limit);

      const body: PaginatedStampResponseBody = {
        ...pagination,
        last_block: lastBlock.rows[0]["last_block"],
        data: data.rows,
      };

      return ResponseUtil.success(body);
    });
  } catch (error) {
    console.error("Error:", error);
    return ResponseUtil.error(
      `Error: stamps with ident: ${ident} not found`,
      500,
    );
  }
};
