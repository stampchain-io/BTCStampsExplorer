// api/v2/cursed/[id].ts
import { getStampByIdOrIdentifier } from "$lib/controller/sharedHandlers.ts";
/**
 * @swagger
 * /api/v2/stamps/cursed/{id}:
 *   get:
 *     summary: Get stamp by stamp id or identifier
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The stamp id or identifier
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
export const handler = getStampByIdOrIdentifier;
