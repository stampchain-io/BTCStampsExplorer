import { FreshContext } from "$fresh/server.ts";
import { CommonClass, StampsClass } from "$lib/database/index.ts";
import { paginate } from "$lib/utils/util.ts";
import { PaginatedRequest, PaginatedStampResponseBody } from "globals";
import { ResponseUtil } from "utils/responseUtil.ts";
import { getPaginationParams } from "$lib/utils/paginationUtils.ts";
import { withDatabaseClient } from "$lib/services/databaseService.ts";

export const handler = async (
  req: PaginatedRequest,
  _ctx: FreshContext,
): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const { limit, page } = getPaginationParams(url);
    const sort_order = (url.searchParams.get("sort_order") as "asc" | "desc") ||
      "asc";

    const body = await withDatabaseClient(async (client) => {
      const [data, totalResult, lastBlock] = await Promise.all([
        StampsClass.get_stamps(client, {
          limit,
          page,
          sort_order,
          type: "stamps",
          all_columns: true,
        }),
        StampsClass.get_total_stamp_count(client, "stamps"),
        CommonClass.get_last_block_with_client(client),
      ]);

      const total = totalResult.rows[0]["total"];
      const pagination = paginate(total, page, limit);

      return {
        ...pagination,
        last_block: lastBlock.rows[0]["last_block"],
        data: data.rows,
      } as PaginatedStampResponseBody;
    });

    return ResponseUtil.success(body);
  } catch (error) {
    console.error(`Error fetching paginated stamps: ${error.message}`);
    return ResponseUtil.error(`Error: Internal server error`, 500);
  }
};
