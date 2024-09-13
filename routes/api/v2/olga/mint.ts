import { FreshContext, Handlers } from "$fresh/server.ts";
import { MintStampInputData, TX, TXError } from "globals";
// import { conf } from "utils/config.ts";
import { serverConfig } from "$server/config/config.ts";
import { mintStampCIP33 } from "utils/minting/olga/mint.ts";
import { validateAndPrepareAssetName } from "utils/minting/stamp.ts";
import { ResponseUtil } from "utils/responseUtil.ts";
import { Buffer } from "buffer";

export const handler: Handlers<TX | TXError> = {
  async POST(req: Request, _ctx: FreshContext) {
    let body: MintStampInputData;
    try {
      body = await req.json();
    } catch (_error) {
      return ResponseUtil.error("Invalid JSON format in request body", 400);
    }

    let assetName;
    try {
      assetName = await validateAndPrepareAssetName(body.assetName);
    } catch (error) {
      return ResponseUtil.error(error.message, 400);
    }

    const prepare = {
      ...body,
      prefix: "stamp" as const,
      assetName: assetName,
      satsPerKB: Number(body.satsPerKB),
      service_fee: body.service_fee ||
        parseInt(serverConfig.MINTING_SERVICE_FEE_FIXED_SATS),
      service_fee_address: body.service_fee_address ||
        serverConfig.MINTING_SERVICE_FEE_ADDRESS,
    };

    try {
      const mint_tx = await mintStampCIP33(prepare);
      if (!mint_tx || !mint_tx.psbt) {
        console.error("Invalid mint_tx structure:", mint_tx);
        return ResponseUtil.error(
          "Error generating mint transaction: Invalid response structure",
          400,
        );
      }

      console.log("Successful mint_tx:", mint_tx);

      // Update the txDetails mapping
      const txDetails = mint_tx.psbt.data.inputs.map((
        input: any,
        index: number,
      ) => ({
        txid: input.hash
          ? Buffer.from(input.hash).reverse().toString("hex")
          : "",
        vout: input.index ?? 0,
        signingIndex: index,
      }));

      return ResponseUtil.success({
        hex: mint_tx.psbt.toHex(),
        base64: mint_tx.psbt.toBase64(),
        cpid: assetName,
        est_tx_size: mint_tx.estimatedTxSize,
        input_value: mint_tx.totalInputValue,
        total_dust_value: mint_tx.totalDustValue,
        est_miner_fee: mint_tx.estMinerFee,
        change_value: mint_tx.totalChangeOutput,
        txDetails: txDetails,
      });
    } catch (error) {
      console.error("Minting error:", error);

      const errorMessage = error.message ||
        "An unexpected error occurred during minting";
      let statusCode = 400;

      if (errorMessage.includes("insufficient funds")) {
        statusCode = 400;
      } else if (errorMessage.includes("UTXO selection failed")) {
        statusCode = 400;
      } else if (errorMessage.includes("Invalid satsPerKB parameter")) {
        statusCode = 400;
      } else {
        statusCode = 500;
      }

      return ResponseUtil.error(errorMessage, statusCode);
    }
  },
};
