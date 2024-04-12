import { CommonClass, getClient, StampsClass } from "$lib/database/index.ts";
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
 * /api/v2/stamps/ident/{ident}:
 *   get:
 *     summary: Get stamps by ident
 *     description: Retrieve stamps based on the provided ident
 *     parameters:
 *       - in: path
 *         name: ident
 *         required: true
 *         description: The ident value
 *         schema:
 *           type: string
 *       - in: query
 *         name: limit
 *         description: The maximum number of stamps to retrieve (default: 1000)
 *         schema:
 *           type: integer
 *       - in: query
 *         name: page
 *         description: The page number of stamps to retrieve (default: 0)
 *         schema:
 *           type: integer
 *     responses:
 *       '200':
 *         description: Successful response with the paginated stamps
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedIdResponseBody'
 *       '404':
 *         description: Stamps with the provided ident not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponseBody'
 *       '500':
 *         description: Internal server error
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
    const page = Number(url.searchParams.get("page")) || 1;
    const client = await getClient();
    const data = await StampsClass.get_stamps_by_ident_with_client(
      client,
      ident.toUpperCase(),
      limit,
      page,
    );
    const total = (await StampsClass.get_total_stamps_by_ident_with_client(
      client,
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
    return new Response(JSON.stringify(body));
  } catch {
    const body: ErrorResponseBody = {
      error: `Error: stamps with ident: ${ident} not found`,
    };
    return new Response(JSON.stringify(body));
  }
};
