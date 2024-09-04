import { FreshContext, Handlers } from "$fresh/server.ts";
import { MintStampInputData, TX, TXError } from "globals";
import { conf } from "utils/config.ts";
import { mintStampCIP33 } from "utils/minting/olga/mint.ts";
import { validateAndPrepareAssetName } from "utils/minting/stamp.ts";
import { ResponseUtil } from "utils/responseUtil.ts";

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
      prefix: "stamp",
      assetName: assetName,
      satsPerKB: Number(body.satsPerKB),
      service_fee: body.service_fee ||
        parseInt(conf.MINTING_SERVICE_FEE_FIXED_SATS),
      service_fee_address: body.service_fee_address ||
        conf.MINTING_SERVICE_FEE_ADDRESS,
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

      // Extract input details from the PSBT
      const txDetails = mint_tx.psbt.data.inputs.map((input, index) => ({
        txid: input.hash
          ? Buffer.from(input.hash).reverse().toString("hex")
          : "",
        vout: input.index,
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

      let errorMessage = "An unexpected error occurred during minting";
      let statusCode = 500;

      if (error instanceof Error) {
        errorMessage = error.message;
        console.error("Error stack:", error.stack);

        if (error.message.includes("Insufficient funds")) {
          errorMessage =
            "Insufficient funds in the wallet for this transaction";
          statusCode = 400;
        } else if (error.message.includes("UTXO selection failed")) {
          errorMessage =
            "Failed to select appropriate UTXOs for the transaction";
          statusCode = 400;
        } else if (error.message.includes("Invalid satsPerKB parameter")) {
          errorMessage = "Invalid fee rate provided";
          statusCode = 400;
        } else if (
          error.message.includes("Cannot read properties of undefined")
        ) {
          errorMessage =
            "Error generating transaction: Invalid response structure";
          statusCode = 500;
        }
      }

      return ResponseUtil.error(errorMessage, statusCode);
    }
  },
};
