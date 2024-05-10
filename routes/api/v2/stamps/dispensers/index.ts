import { CommonClass, getClient } from "$lib/database/index.ts";
import {
  ErrorResponseBody,
  PaginatedRequest,
  PaginatedStampResponseBody,
} from "globals";
import { paginate } from "$lib/utils/util.ts";
import { get_all_dispensers } from "$lib/utils/xcp.ts";

/**
 * @swagger
 * /api/v2/stamps/dispensers:
 *   get:
 *     summary: Get paginated open Dispensers
 *     description: Retrieve paginated dispensers with optional limit and page parameters
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1000
 *         description: The maximum number of dispensers to retrieve per page
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           minimum: 1
 *           default: 1
 *         description: The page number of dispensers to retrieve
 *     responses:
 *       '200':
 *         description: Successful response with paginated dispensers
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/PaginatedStampResponseBody'
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponseBody'
 */

export const handler = async (
  req: PaginatedRequest,
): Promise<Response> => {
  try {
    const url = new URL(req.url);
    const limit = Number(url.searchParams.get("limit")) || 1000;
    const page = Number(url.searchParams.get("page")) || 1;
    const client = await getClient();
    const last_block = await CommonClass.get_last_block_with_client(client);
    const { total, dispensers } = await get_all_dispensers(); // Call the get_all_dispensers function and destructure the returned values
    const pagination = paginate(total, page, limit); // Update the pagination variable
    client?.close();
    const body: PaginatedStampResponseBody = {
      ...pagination,
      last_block: last_block.rows[0]["last_block"],
      data: dispensers, // Update the dispensers in the response body
    };
    return new Response(JSON.stringify(body));
  } catch (error) {
    console.log("Error:", error); // Add console log output
    const body: ErrorResponseBody = { error: `Error: Internal server error` };
    return new Response(JSON.stringify(body));
  }
};
