import { CommonClass, getClient } from "$lib/database/index.ts";
import { PaginatedDispenserResponseBody, PaginatedRequest } from "globals";
import { paginate } from "$lib/utils/util.ts";
import { get_all_dispensers } from "$lib/utils/xcp.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";

export const handler = async (
  req: PaginatedRequest,
): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit")) || 1000;
    const page = Number(url.searchParams.get("page")) || 1;
    const client = await getClient();
    const last_block = await CommonClass.get_last_block_with_client(client);
    const { total, dispensers } = await get_all_dispensers(page, limit); // Pass page and limit
    const pagination = paginate(total, page, limit);
    client?.close();
    const body: PaginatedDispenserResponseBody = {
      page: pagination.page,
      limit: pagination.limit,
      totalPages: pagination.totalPages,
      total: pagination.total,
      last_block: last_block.rows[0]["last_block"],
      dispensers, // Return dispensers array
    };
    return ResponseUtil.success(body);
  } catch (error) {
    console.error("Error:", error);
    return ResponseUtil.error("Error: Internal server error", 500);
  }
};
