import { Handlers } from "$fresh/server.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import {
  ComposeDetachOptions,
  normalizeFeeRate,
  XcpManager,
} from "$server/services/xcpService.ts";
import { PSBTService } from "$server/services/transaction/psbtService.ts";
import { serverConfig } from "$server/config/config.ts";

interface StampDetachInput {
  utxo: string;
  destination?: string;
  options: Omit<ComposeDetachOptions, "fee_per_kb" | "sat_per_vbyte"> & {
    fee_per_kb?: number;
    satsPerVB?: number;
    regular_dust_size?: number;
    return_psbt?: boolean;
    verbose?: boolean;
    service_fee?: number;
    service_fee_address?: string;
    [key: string]: unknown;
  };
}

export const handler: Handlers = {
  async POST(req: Request) {
    try {
      const input: StampDetachInput = await req.json();
      console.log("Received stamp detach input:", input);

      const { utxo, destination, options } = input;

      // Normalize fee rate from either input type
      let normalizedFees;
      try {
        const feeArgs: { satsPerKB?: number; satsPerVB?: number } = {};
        if (options.fee_per_kb !== undefined) {
          feeArgs.satsPerKB = options.fee_per_kb;
        }
        if (options.satsPerVB !== undefined) {
          feeArgs.satsPerVB = options.satsPerVB;
        }
        normalizedFees = normalizeFeeRate(feeArgs);
        if (!normalizedFees || normalizedFees.normalizedSatsPerVB <= 0) {
          return ResponseUtil.badRequest(
            "Invalid fee rate calculated (must result in > 0 sats/vB).",
          );
        }
      } catch (error) {
        return ResponseUtil.badRequest(
          error instanceof Error ? error.message : "Invalid fee rate arguments",
        );
      }

      try {
        // Prepare options for XcpManager.composeDetach
        const xcpApiOptions = { ...options };
        delete xcpApiOptions.satsPerVB;
        delete xcpApiOptions.service_fee;
        delete xcpApiOptions.service_fee_address;

        const response = await XcpManager.composeDetach(
          utxo,
          destination || "",
          {
            ...xcpApiOptions,
            fee_per_kb: normalizedFees.normalizedSatsPerKB,
            return_psbt: true,
            verbose: true,
          } as ComposeDetachOptions,
        );

        if (!response?.result?.psbt) {
          if (response?.error) {
            return ResponseUtil.badRequest(response.error);
          }
          throw new Error("Failed to compose detach transaction.");
        }

        // Prepare service fee details for PSBTService
        const serviceFeeInput = options.service_fee !== undefined
          ? options.service_fee
          : parseInt(serverConfig.MINTING_SERVICE_FEE_FIXED_SATS, 10);
        const serviceFeeAddrInput = options.service_fee_address !== undefined
          ? options.service_fee_address
          : serverConfig.MINTING_SERVICE_FEE_ADDRESS;

        const processPsbtOptions: {
          serviceFeeDetails?: { fee: number; address: string };
        } = {};

        if (serviceFeeInput > 0 && serviceFeeAddrInput) {
          processPsbtOptions.serviceFeeDetails = {
            fee: serviceFeeInput,
            address: serviceFeeAddrInput,
          };
        }

        // Determine the address to use for change and fee reference in processCounterpartyPSBT
        // This should be the address that owns the input UTXO for detach.
        // For detach, the primary input/signer is implicitly derived from the UTXO itself by Counterparty.
        // We need to derive this address or have it provided if it can differ from `destination`.
        // For now, assuming the `destination` (if provided) or a derived address from UTXO (if possible) or a placeholder if complex.
        // This part is tricky for detach as the `address` parameter for processCounterpartyPSBT is the change recipient.
        // Let's assume for now that if a destination is provided, change can go there, otherwise, it's more complex.
        // The `processCounterpartyPSBT` userAddress is for change. If `destination` is where detached asset goes,
        // change should go to the owner of the UTXO. This needs clarification or a way to get owner of `utxo`.
        // For simplicity, if `destination` is present, use it. Otherwise, this will need to be revisited.
        const userAddressForPsbtProcessing = destination || ""; // THIS IS A SIMPLIFICATION AND MIGHT BE WRONG for change
        if (!userAddressForPsbtProcessing) {
          // TODO(@stampchain): We need a reliable way to get the source address of the UTXO if destination is not provided for change.
          // This is a critical point for detach if change needs to go back to original owner.
          // For now, this path might lead to issues if change is generated and destination is empty.
          console.warn(
            "[StampDetach] User address for PSBT processing (change) is empty. This might lead to issues if change is generated.",
          );
        }

        // Process PSBT using shared service
        const processedPSBT = await PSBTService.processCounterpartyPSBT(
          response.result.psbt,
          userAddressForPsbtProcessing,
          normalizedFees.normalizedSatsPerVB,
          false,
          processPsbtOptions,
        );

        return new Response(JSON.stringify(processedPSBT), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        if (
          error instanceof Error && error.message.includes("Insufficient BTC")
        ) {
          return ResponseUtil.badRequest(error.message);
        }
        throw error;
      }
    } catch (error) {
      console.error("Error processing stamp detach request:", error);
      return ResponseUtil.internalError(
        error,
        "Failed to process stamp detach request",
      );
    }
  },
};
