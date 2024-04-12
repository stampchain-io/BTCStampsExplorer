import { HandlerContext } from "$fresh/server.ts";
import { CommonClass, CursedClass, getClient } from "$lib/database/index.ts";
import { PROTOCOL_IDENTIFIERS } from "$lib/utils/protocol.ts";
import {
  ErrorResponseBody,
  IdentHandlerContext,
  PaginatedIdResponseBody,
  PaginatedRequest,
} from "globals";
import { paginate } from "../../../../../lib/utils/util.ts";

/**
 * @swagger
 * /api/v2/cursed/ident/{ident}:
 *   get:
 *     summary: Get paginated cursed stamps by ident
 *     parameters:
 *       - in: path
 *         name: ident
 *         required: true
 *         schema:
 *           type: string
 *         description: The ident of the stamp
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: The maximum number of stamps to retrieve (default: 1000)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: The page number of the results (default: 0)
 *     responses:
 *       '200':
 *         description: OK
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedIdResponseBody'
 *       '500':
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponseBody'
 */
export const handler = async (
  req: PaginatedRequest,
  ctx: IdentHandlerContext,
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
    const client = await getClient();
    const data = await CursedClass.get_cursed_by_ident_with_client(
      client,
      ident.toUpperCase(),
      limit,
      page,
    );
    const total = await CursedClass.get_total_cursed_by_ident_with_client(
      client,
      ident.toUpperCase(),
    );
    const last_block = await CommonClass.get_last_block_with_client(client);
    const pagination = paginate(total, page, limit);
    const body: PaginatedIdResponseBody = {
      ...pagination,
      last_block: last_block.rows[0]["last_block"],
      ident: ident.toUpperCase(),
      data: data.rows,
    };
    return new Response(JSON.stringify(body));
  } catch {
    const body: ErrorResponseBody = {
      error: `Error: Cursed stamps with ident: ${ident} not found`,
    };
    return new Response(JSON.stringify(body));
  }
};
