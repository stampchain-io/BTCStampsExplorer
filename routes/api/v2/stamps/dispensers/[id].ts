import { api_get_stamp_all_data } from "$lib/controller/stamp.ts";
import {
  ErrorResponseBody,
  IdHandlerContext,
  StampResponseBody,
} from "globals";
import { get_dispensers } from "$lib/utils/xcp.ts";
/**
 * @swagger
 * /api/v2/stamps/dispensers/{id}:
 *   get:
 *     summary: Get Dispensers by ID
 *     description: Retrieve all dispensers associated with a specific stamp ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the stamp
 *         schema:
 *           type: string
 *     responses:
 *       '200':
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StampResponseBody'
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponseBody'
 */

export const handler = async (
  _req: Request,
  ctx: IdHandlerContext,
): Promise<Response> => {
  const { id } = ctx.params;
  try {
    const data = await api_get_stamp_all_data(id);
    if (!data) {
      throw new Error("Stamp not found");
    }
    const dispensers = await get_dispensers(id);
    const body: StampResponseBody = {
      data: data,
      dispensers: dispensers, // Add the dispensers to the response body
    };
    return new Response(JSON.stringify(body));
  } catch (error) {
    console.error("Error:", error);
    const body: ErrorResponseBody = { error: `Error: Internal server error` };
    return new Response(JSON.stringify(body));
  }
};
