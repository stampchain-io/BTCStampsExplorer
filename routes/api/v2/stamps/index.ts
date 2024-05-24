import { HandlerContext } from "$fresh/server.ts";
import { CommonClass, getClient, StampsClass } from "$lib/database/index.ts";
import { paginate } from "$lib/utils/util.ts";
import { PaginatedRequest, PaginatedStampResponseBody } from "globals";
import { ResponseUtil } from "utils/responseUtil.ts";

export const handler = async (
  req: PaginatedRequest,
  _ctx: HandlerContext,
): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const { searchParams } = url;
    const limit = Number(searchParams.get("limit")) || 1000;
    const page = Number(searchParams.get("page")) || 1;
    const sort_order = (searchParams.get("sort_order") as "asc" | "desc") ||
      "asc";

    const client = await getClient();

    const [data, totalResult, lastBlock] = await Promise.all([
      StampsClass.get_stamps_by_page_with_client(
        client,
        limit,
        page,
        sort_order,
        "stamps",
      ),
      StampsClass.get_total_stamps_with_client(client, "stamps"),
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
  } catch (error) {
    console.error(`Error fetching paginated stamps: ${error.message}`);
    return ResponseUtil.error(`Error: Internal server error`, 500);
  }
};
