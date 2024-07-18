import { CommonClass, getClient, StampsClass } from "$lib/database/index.ts";
import { PROTOCOL_IDENTIFIERS } from "$lib/utils/protocol.ts";
import {
  IdentHandlerContext,
  PaginatedIdResponseBody,
  PaginatedRequest,
} from "globals";
import { paginate } from "utils/util.ts";
import { ResponseUtil } from "utils/responseUtil.ts"; // Import ResponseUtil

export const handler = async (
  req: PaginatedRequest,
  ctx: IdentHandlerContext,
): Promise<Response> => {
  const { ident } = ctx.params;
  if (!PROTOCOL_IDENTIFIERS.includes(ident.toUpperCase())) {
    return ResponseUtil.error(`Error: ident: ${ident} not found`, 404);
  }
  try {
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit")) || 1000;
    const page = Number(url.searchParams.get("page")) || 1;
    const client = await getClient();
    const data = await StampsClass.get_stamps_by_ident_with_client(
      client,
      [ident.toUpperCase()],
      limit,
      page,
      "stamps",
    );
    const total = (await StampsClass.get_total_stamp_count(
      client,
      "stamps",
      ident.toUpperCase(),
    )).rows[0]["total"];
    const pagination = paginate(total, page, limit);
    const last_block = await CommonClass.get_last_block_with_client(client);
    const body: PaginatedIdResponseBody = {
      ...pagination,
      last_block: last_block.rows[0]["last_block"],
      ident: ident.toUpperCase(),
      data: data.rows,
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
