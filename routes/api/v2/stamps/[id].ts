// api/v2/stamps/[id].ts
import { getStampByIdOrIdentifier } from "$lib/controller/sharedHandlers.ts";
/**
 * @swagger
 * /api/v2/stamps/block/{block_index}:
 *   get:
 *     summary: Get stamps by block index
 *     parameters:
 *       - in: path
 *         name: block_index
 *         required: true
 *         schema:
 *           type: string
 *         description: The index of the block
 *     responses:
 *       '200':
 *         description: Successful response
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/StampBlockResponseBody'
 *       '404':
 *         description: Block not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponseBody'
 */

export const handler = getStampByIdOrIdentifier;
