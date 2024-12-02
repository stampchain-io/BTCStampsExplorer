import { FreshContext, Handlers } from "$fresh/server.ts";
import { MintStampInputData, TX, TXError } from "globals";
import { serverConfig } from "$server/config/config.ts";
import {
  StampMintService,
  StampValidationService,
} from "$server/services/stamp/index.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { hex2bin } from "$lib/utils/binary/baseUtils.ts";
import { formatPsbtForLogging } from "$server/services/transaction/psbtService.ts";
import { normalizeFeeRate } from "$server/services/xcpService.ts";

// Then create the extended interface by omitting the fee field from the base interface
interface ExtendedMintStampInputData
  extends Omit<MintStampInputData, "satsPerKB"> {
  dryRun?: boolean;
  // Make all fee-related fields optional but mutually exclusive
  satsPerKB?: number;
  satsPerVB?: number;
  feeRate?: number; // legacy support
}

export const handler: Handlers<TX | TXError> = {
  async POST(req: Request, _ctx: FreshContext) {
    let body: ExtendedMintStampInputData;
    try {
      body = await req.json();
    } catch (_error) {
      return ResponseUtil.badRequest("Invalid JSON format in request body");
    }

    // Normalize fee rate from any of the possible inputs
    let normalizedFees;
    try {
      // Handle legacy feeRate first
      const feeInput = {
        satsPerKB: body.satsPerKB,
        satsPerVB: body.satsPerVB,
      };

      // If neither is provided but legacy feeRate exists, use that as satsPerKB
      if (
        body.feeRate !== undefined && !feeInput.satsPerKB && !feeInput.satsPerVB
      ) {
        console.log("Using legacy feeRate as satsPerKB:", body.feeRate);
        feeInput.satsPerKB = body.feeRate;
      }

      normalizedFees = normalizeFeeRate(feeInput);
    } catch (error) {
      return ResponseUtil.badRequest(
        error instanceof Error ? error.message : "Invalid fee rate",
      );
    }

    const isDryRun = body.dryRun === true;

    let assetName;
    try {
      assetName = await StampValidationService.validateAndPrepareAssetName(
        body.assetName,
      );
    } catch (error: unknown) {
      return ResponseUtil.badRequest(
        error instanceof Error ? error.message : "Invalid asset name",
      );
    }

    const prepare = {
      ...body,
      prefix: "stamp" as const,
      assetName: assetName,
      satsPerKB: normalizedFees.normalizedSatsPerKB,
      satsPerVB: normalizedFees.normalizedSatsPerVB,
      ...(body.service_fee && {
        service_fee: body.service_fee ||
          parseInt(serverConfig.MINTING_SERVICE_FEE_FIXED_SATS),
      }),
      ...(body.service_fee && {
        service_fee_address: body.service_fee_address ||
          serverConfig.MINTING_SERVICE_FEE_ADDRESS,
      }),
    };

    try {
      const mint_tx = await StampMintService.createStampIssuance(prepare);

      if (isDryRun) {
        // Return just the fee details for estimation
        return ResponseUtil.success({
          fee: mint_tx.estMinerFee,
          dust: mint_tx.totalDustValue,
          total: mint_tx.totalOutputValue,
          txDetails: {
            estimatedSize: mint_tx.estimatedTxSize,
            totalInputValue: mint_tx.totalInputValue,
            changeOutput: mint_tx.totalChangeOutput,
          },
        });
      }

      if (!mint_tx || !mint_tx.psbt) {
        console.error("Invalid mint_tx structure:", mint_tx);
        return ResponseUtil.badRequest(
          "Error generating mint transaction: Invalid response structure",
        );
      }

      console.log("Successful mint_tx:", {
        psbt: formatPsbtForLogging(mint_tx.psbt),
        satsPerVB: mint_tx.satsPerVB,
        estimatedTxSize: mint_tx.estimatedTxSize,
        totalInputValue: mint_tx.totalInputValue,
        totalOutputValue: mint_tx.totalOutputValue,
        totalChangeOutput: mint_tx.totalChangeOutput,
        totalDustValue: mint_tx.totalDustValue,
        estMinerFee: mint_tx.estMinerFee,
        changeAddress: mint_tx.changeAddress,
      });

      // Update the txDetails mapping without changing the API response format
      const txInputs = mint_tx.psbt.txInputs;
      const txDetails = txInputs.map((input: any, index: number) => {
        let inputTxid = ""; // Renamed to clarify this is the input transaction ID
        let vout = 0;

        if (input.hash && typeof input.index === "number") {
          // Convert hash to Uint8Array, then to hex string
          // This is the txid of the previous transaction being spent by this input
          const hashBytes = new Uint8Array(hex2bin(input.hash.toString("hex")));
          // Reverse bytes and convert to hex string
          inputTxid = Array.from(hashBytes)
            .reverse()
            .map((b) => b.toString(16).padStart(2, "0"))
            .join("");
          vout = input.index; // The output index in the previous transaction
        } else {
          throw new Error(
            `Unable to extract input txid and vout for input at index ${index}`,
          );
        }

        return {
          txid: inputTxid, // The transaction ID of the input being spent
          vout, // The output index in the input transaction
          signingIndex: index,
        };
      });

      // Return the API response with the modified format
      return ResponseUtil.success({
        hex: mint_tx.psbt.toHex(),
        cpid: assetName,
        est_tx_size: mint_tx.estimatedTxSize,
        input_value: mint_tx.totalInputValue,
        total_dust_value: mint_tx.totalDustValue,
        est_miner_fee: mint_tx.estMinerFee,
        change_value: mint_tx.totalChangeOutput,
        txDetails: txDetails.map((input) => ({
          txid: input.txid,
          vout: input.vout,
          signingIndex: input.signingIndex,
        })),
      });
    } catch (error: unknown) {
      console.error("Minting error:", error);
      const errorMessage = error instanceof Error
        ? error.message
        : "An unexpected error occurred during minting";

      // Client errors (400)
      if (
        errorMessage.includes("insufficient funds") ||
        errorMessage.includes("UTXO selection failed") ||
        errorMessage.includes("Invalid satsPerKB parameter")
      ) {
        return ResponseUtil.badRequest(errorMessage);
      }

      // Server errors (500)
      return ResponseUtil.internalError(error, errorMessage);
    }
  },
};
