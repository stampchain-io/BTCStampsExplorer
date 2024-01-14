import { HandlerContext } from "$fresh/server.ts";
import { CommonClass, connectDb, StampsClass } from "$lib/database/index.ts";
import { PROTOCOL_IDENTIFIERS } from "$lib/utils/protocol.ts";
import {
  ErrorResponseBody,
  IdentHandlerContext,
  PaginatedIdResponseBody,
  PaginatedRequest,
} from "globals";

export const handler = async (
  req: PaginatedRequest,
  ctx: HandlerContext,
): Promise<Response> => {
  const { ident } = ctx.params;
  if (!PROTOCOL_IDENTIFIERS.includes(ident.toUpperCase())) {
    const body: ErrorResponseBody = {
      error: `Error: ident: ${ident} not found`,
    };
    return new Response(JSON.stringify(body));
  }
  try {
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit")) || 1000;
    const page = Number(url.searchParams.get("page")) || 0;
    const client = await connectDb();
    const data = await StampsClass.get_stamps_by_ident_with_client(
      client,
      ident.toUpperCase(),
      limit,
      page,
    );
    const total = await StampsClass.get_total_stamps_by_ident_with_client(
      client,
      ident.toUpperCase(),
    );
    const last_block = await CommonClass.get_last_block_with_client(client);
    const body: PaginatedIdResponseBody = {
      ident: ident.toUpperCase(),
      data: data.rows,
      limit,
      page,
      total: total.rows[0]["total"],
      last_block: last_block.rows[0]["last_block"],
    };
    return new Response(JSON.stringify(body));
  } catch {
    const body: ErrorResponseBody = {
      error: `Error: stamps with ident: ${ident} not found`,
    };
    return new Response(JSON.stringify(body));
  }
};
