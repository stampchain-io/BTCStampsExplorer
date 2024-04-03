import { FreshContext, Handlers } from "$fresh/runtime.ts";
import { MintStampInputData, TX, TXError } from "globals";
import { conf } from "utils/config.ts";
import { mintStampCIP33 } from "utils/minting/olga/mint.ts";
import { generateAvailableAssetName } from "utils/minting/stamp.ts";

/**
 * @swagger
 * /api/v2/olga/mint:
 *   post:
 *     summary: Mint a new OLGA STAMP.
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/MintStampInputData'
 *     responses:
 *       '200':
 *         description: Successful response with the hex value.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 hex:
 *                   type: string
 *                   description: The hex value.
 *       '400':
 *         description: Bad request error response.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   description: The error message.
 */

export const handler: Handlers<TX | TXError> = {
  async POST(req: Request, _ctx: FreshContext) {
    const body: MintStampInputData = await req.json();

    const prepare = {
      ...body,
      prefix: "stamp",
      assetName: await generateAvailableAssetName(),
      service_fee: body.service_fee ||
        parseInt(conf.MINTING_SERVICE_FEE_FIXED_SATS),
      service_fee_address: body.service_fee_address ||
        conf.MINTING_SERVICE_FEE_ADDRESS,
    };
    const mint_tx = await mintStampCIP33(prepare);
    console.log("hex", mint_tx?.toHex());
    if (!mint_tx) {
      return new Response(JSON.stringify({
        error: "Error generating mint transaction",
      }));
    }
    return new Response(JSON.stringify({
      hex: mint_tx.toHex(),
    }));
  },
};
