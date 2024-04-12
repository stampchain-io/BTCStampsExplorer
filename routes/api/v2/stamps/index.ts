import { HandlerContext } from "$fresh/server.ts";
import { CommonClass, getClient, StampsClass } from "$lib/database/index.ts";
import { paginate } from "$lib/utils/util.ts";
import {
  ErrorResponseBody,
  PaginatedRequest,
  PaginatedStampResponseBody,
} from "globals";

/**
 * @swagger
 * /api/v2/stamps:
 *   get:
 *     summary: Get paginated stamps
 *     description: Retrieve a paginated list of stamps.
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: The maximum number of stamps to return per page. Defaults to 1000.
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: The page number to retrieve. Defaults to 1.
 *     responses:
 *       '200':
 *         description: Successful response with paginated stamps.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedStampResponseBody'
 *       '500':
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponseBody'
 */

export const handler = async (
  req: PaginatedRequest,
  _ctx: HandlerContext,
): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit")) || 1000;
    const page = Number(url.searchParams.get("page")) || 1;
    const sort_order = url.searchParams.get("sort_order") || "asc";
    const client = await getClient();
    const data = await StampsClass.get_stamps_by_page_with_client(
      client,
      limit,
      page,
      sort_order,
    );
    const total =
      (await StampsClass.get_total_stamps_with_client(client)).rows[0]["total"];
    const last_block = await CommonClass.get_last_block_with_client(client);

    const pagination = paginate(total, page, limit);

    const body: PaginatedStampResponseBody = {
      ...pagination,
      last_block: last_block.rows[0]["last_block"],
      data: data.rows,
    };
    return new Response(JSON.stringify(body));
  } catch {
    const body: ErrorResponseBody = { error: `Error: Internal server error` };
    return new Response(JSON.stringify(body));
  }
};
