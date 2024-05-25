import { FreshContext, Handlers } from "$fresh/server.ts";
import { MintStampInputData, TX, TXError } from "globals";
import { conf } from "utils/config.ts";
import { mintStampCIP33 } from "utils/minting/olga/mint.ts";
import { generateAvailableAssetName } from "utils/minting/stamp.ts";
import { ResponseUtil } from "utils/responseUtil.ts";

export const handler: Handlers<TX | TXError> = {
  async POST(req: Request, _ctx: FreshContext) {
    let body: MintStampInputData;
    try {
      body = await req.json();
    } catch (_error) {
      return ResponseUtil.error("Invalid JSON format in request body", 500);
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
        return ResponseUtil.error("Error generating mint transaction", 400);
      }

      console.log(mint_tx);
      return ResponseUtil.success({
        hex: mint_tx.psbt.toHex(),
        cpid: assetName,
        base64: mint_tx.psbt.toBase64(),
        est_tx_size: mint_tx.estimatedTxSize,
        input_value: mint_tx.totalInputValue,
        total_dust_value: mint_tx.totalDustValue,
        est_miner_fee: mint_tx.estMinerFee,
        change_value: mint_tx.totalChangeOutput,
      });
    } catch (error) {
      return ResponseUtil.error(`Error: ${error.message}`, 500);
    }
  },
};
