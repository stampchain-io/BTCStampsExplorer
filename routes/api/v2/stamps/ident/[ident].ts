import { withDatabaseClient } from "$lib/services/databaseService.ts";
import { StampRepository } from "$lib/database/index.ts";
import { PROTOCOL_IDENTIFIERS } from "$lib/utils/protocol.ts";
import { IdentHandlerContext, PaginatedStampResponseBody } from "globals";
import { ResponseUtil } from "utils/responseUtil.ts";
import { getPaginationParams } from "$lib/utils/paginationUtils.ts";
import { paginate } from "$lib/utils/util.ts";
import { BlockService } from "$lib/services/blockService.ts";

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
        StampRepository.getStampsFromDb(client, {
          limit,
          page,
          sort_order,
          type: "stamps",
          ident: ident.toUpperCase(),
          all_columns: true,
        }),
        StampRepository.getTotalStampCountFromDb(
          client,
          "stamps",
          ident.toUpperCase(),
        ),
        BlockService.getLastBlock(),
      ]);

      const total = totalResult.rows[0]["total"];
      const pagination = paginate(total, page, limit);

      const body: PaginatedStampResponseBody = {
        ...pagination,
        last_block: lastBlock.last_block,
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
