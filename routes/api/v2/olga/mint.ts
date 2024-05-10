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
    let body: MintStampInputData;
    try {
      body = await req.json();
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: "Invalid JSON format in request body",
        }),
        { status: 400 },
      );
    }

    const assetName = await generateAvailableAssetName();

    const prepare = {
      ...body,
      prefix: "stamp",
      assetName: assetName,
      service_fee: body.service_fee ||
        parseInt(conf.MINTING_SERVICE_FEE_FIXED_SATS),
      service_fee_address: body.service_fee_address ||
        conf.MINTING_SERVICE_FEE_ADDRESS,
    };

    try {
      const mint_tx = await mintStampCIP33(prepare);
      if (!mint_tx) {
        return new Response(
          JSON.stringify({
            error: "Error generating mint transaction",
          }),
          { status: 400 },
        );
      }

      console.log(mint_tx);
      return new Response(JSON.stringify({
        hex: mint_tx.psbt.toHex(),
        cpid: assetName,
        base64: mint_tx.psbt.toBase64(),
        est_tx_size: mint_tx.estimatedTxSize,
        input_value: mint_tx.totalInputValue,
        total_dust_value: mint_tx.totalDustValue,
        est_miner_fee: mint_tx.estMinerFee,
        change_value: mint_tx.totalChangeOutput,
      }));
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: `Error: ${error.message}`,
        }),
        { status: 500 },
      );
    }
  },
};
