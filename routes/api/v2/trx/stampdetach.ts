import { Handlers } from "$fresh/server.ts";
import { ApiResponseUtil } from "$lib/utils/apiResponseUtil.ts";
import { serverConfig } from "$server/config/config.ts";
import { GeneralBitcoinTransactionBuilder } from "$server/services/transaction/generalBitcoinTransactionBuilder.ts";
import type { ComposeDetachOptions } from "$server/services/xcp/xcpManagerDI.ts";
import { normalizeFeeRate, XcpManager } from "$server/services/xcpService.ts";

export const handler: Handlers = {
  async POST(req) {
    try {
      const body = await req.json();
      const { utxo, destination, options = {} } = body;

      // Validate required parameters
      if (!utxo) {
        return ApiResponseUtil.badRequest("Missing required parameter: utxo");
      }

      // Parse UTXO format
      const [txid, voutStr] = utxo.split(":");
      const vout = parseInt(voutStr, 10);

      if (!txid || isNaN(vout)) {
        return ApiResponseUtil.badRequest(
          "Invalid UTXO format. Expected format: 'txid:vout'",
        );
      }

      // Normalize fees
      let normalizedFees;
      try {
        normalizedFees = normalizeFeeRate({
          ...(options.fee_per_kb && { satsPerKB: options.fee_per_kb }),
          ...(options.satsPerVB && { satsPerVB: options.satsPerVB }),
        });
      } catch (error) {
        return ApiResponseUtil.badRequest(
          error instanceof Error ? error.message : "Invalid fee rate",
        );
      }

      try {
        // Prepare XCP API options
        const xcpApiOptions = { ...options };
        delete xcpApiOptions.satsPerVB; // Not for XCP API
        delete xcpApiOptions.service_fee; // Not for XCP API
        delete xcpApiOptions.service_fee_address; // Not for XCP API

        // ✅ NEW CLEAN PATTERN: Get raw hex instead of PSBT
        const response = await XcpManager.composeDetach(
          utxo,
          destination || "",
          {
            ...xcpApiOptions,
            fee_per_kb: normalizedFees.normalizedSatsPerKB,
            return_psbt: false, // ✅ CHANGED: Get raw hex, not PSBT
            verbose: true, // ✅ ADDED: Get detailed response
          } as ComposeDetachOptions,
        );

        // ✅ NEW: Check for raw transaction instead of PSBT
        if (!response?.result?.rawtransaction) {
          if (response?.error) {
            return ApiResponseUtil.badRequest(response.error);
          }
          throw new Error(
            "Failed to compose detach transaction - no raw transaction returned.",
          );
        }

        // ✅ NEW: Use GeneralBitcoinTransactionBuilder instead of deprecated processCounterpartyPSBT
        const serviceFeeInput = options.service_fee !== undefined
          ? options.service_fee
          : parseInt(serverConfig.MINTING_SERVICE_FEE_FIXED_SATS, 10);
        const serviceFeeAddrInput = options.service_fee_address !== undefined
          ? options.service_fee_address
          : serverConfig.MINTING_SERVICE_FEE_ADDRESS;

        // Determine user address for change (same logic as before)
        const userAddressForPsbtProcessing = destination || "";
        if (!userAddressForPsbtProcessing) {
          // TODO(@stampchain): We need a reliable way to get the source address of the UTXO if destination is not provided for change.
          // This is a critical point for detach if change needs to go back to original owner.
          // For now, this path might lead to issues if change is generated and destination is empty.
          // Warning: User address for PSBT processing (change) is empty
        }

        const psbtResult = await GeneralBitcoinTransactionBuilder.generatePSBT(
          response.result.rawtransaction, // ✅ Use raw hex from Counterparty
          {
            address: userAddressForPsbtProcessing,
            satsPerVB: normalizedFees.normalizedSatsPerVB,
            serviceFee: serviceFeeInput > 0 ? serviceFeeInput : undefined,
            serviceFeeAddress: serviceFeeInput > 0
              ? serviceFeeAddrInput
              : undefined,
            operationType: "detach", // ✅ Specify operation type
            customOutputs: [], // ✅ No custom outputs needed for detach
          },
        );

        // ✅ NEW: Return the same format as the deprecated method
        const processedPSBT = {
          psbtHex: psbtResult.psbt.toHex(),
          inputsToSign: psbtResult.psbt.txInputs.map((_, index) => ({
            index,
            address: userAddressForPsbtProcessing,
            sighashTypes: [1], // SIGHASH_ALL
          })),
          estimatedFee: psbtResult.estMinerFee,
          estimatedVsize: psbtResult.estimatedTxSize,
          totalInputValue: BigInt(psbtResult.totalInputValue),
          totalOutputValue: BigInt(psbtResult.totalOutputValue),
          finalUserChange: BigInt(psbtResult.totalChangeOutput),
        };

        return ApiResponseUtil.success(processedPSBT);
      } catch (error) {
        if (
          error instanceof Error && error.message.includes("Insufficient BTC")
        ) {
          return ApiResponseUtil.badRequest(error.message);
        }
        throw error;
      }
    } catch (error) {
      console.error("Error composing detach transaction:", error);
      return ApiResponseUtil.internalError(
        error,
        "Failed to compose detach transaction",
      );
    }
  },
};
