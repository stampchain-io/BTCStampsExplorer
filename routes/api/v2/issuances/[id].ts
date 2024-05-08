// api/v2/issuances/[id].ts
import { getStampByIdOrIdentifier } from "$lib/controller/sharedHandlers.ts";
/**
 * @swagger
 * /api/v2/issuances/{id}:
 *   get:
 *     summary: Get stamp issuances by stamp id or identifier
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
 *               $ref: '#/components/schemas/StampsResponseBody'
 *       '500':
 *         description: Internal server error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ErrorResponseBody'
 */
export const handler = getStampByIdOrIdentifier;
