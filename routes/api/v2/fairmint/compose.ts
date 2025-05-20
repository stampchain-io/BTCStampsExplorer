import { Handlers } from "$fresh/server.ts";
import { normalizeFeeRate, XcpManager } from "$server/services/xcpService.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { PSBTService } from "$server/services/transaction/psbtService.ts";
import { serverConfig } from "$server/config/config.ts";

interface FairmintComposeBody {
  address: string;
  asset: string;
  quantity: number;
  options: {
    fee_per_kb?: number; // For XCP API call and backward compatibility
    satsPerVB?: number; // Preferred for PSBTService
    service_fee?: number; // Optional service fee amount in sats
    service_fee_address?: string; // Optional service fee address
    [key: string]: any; // Allow other options for XcpManager.composeFairmint
  };
  // Allow top-level service_fee and service_fee_address for flexibility from client
  service_fee?: number;
  service_fee_address?: string;
}

export const handler: Handlers = {
  async POST(req, _ctx) {
    try {
      const body: FairmintComposeBody = await req.json();
      const { address, asset, quantity, options } = body;

      // Validate required parameters
      if (!address || !asset || quantity === undefined) {
        return ResponseUtil.badRequest(
          "Missing required parameters: address, asset, or quantity",
        );
      }

      // Consolidate service fee parameters (prefer top-level if provided)
      const feeService = body.service_fee !== undefined
        ? body.service_fee
        : options?.service_fee;
      const feeServiceAddress = body.service_fee_address !== undefined
        ? body.service_fee_address
        : options?.service_fee_address;

      // Normalize fee rate
      let normalizedFees;
      try {
        const feeArgs: { satsPerKB?: number; satsPerVB?: number } = {};
        if (options?.fee_per_kb !== undefined) {
          feeArgs.satsPerKB = options.fee_per_kb;
        }
        if (options?.satsPerVB !== undefined) {
          feeArgs.satsPerVB = options.satsPerVB;
        }
        normalizedFees = normalizeFeeRate(feeArgs);
        if (!normalizedFees || normalizedFees.normalizedSatsPerVB <= 0) {
          return ResponseUtil.badRequest(
            "Invalid fee rate provided or calculated (must result in > 0 sats/vB).",
          );
        }
      } catch (error) {
        return ResponseUtil.badRequest(
          error instanceof Error ? error.message : "Invalid fee rate arguments",
        );
      }

      try {
        // Prepare options for XcpManager.composeFairmint
        // It expects fee_per_kb. Other options from client's `options` object are passed through.
        const xcpApiOptions = { ...options };
        delete xcpApiOptions.satsPerVB; // Not for XCP API call
        delete xcpApiOptions.service_fee; // Not for XCP API call
        delete xcpApiOptions.service_fee_address; // Not for XCP API call

        const response = await XcpManager.composeFairmint(
          address,
          asset,
          quantity,
          {
            ...xcpApiOptions,
            return_psbt: true,
            fee_per_kb: normalizedFees.normalizedSatsPerKB, // XCP API needs fee_per_kb
          },
        );

        if (!response?.result?.psbt) {
          if (response?.error) {
            return ResponseUtil.badRequest(response.error);
          }
          throw new Error("Failed to compose fairmint transaction.");
        }

        // console.log("PSBT Base64 from XCP for FAIRMINT:", response.result.psbt);

        // Prepare service fee details for PSBTService
        const serviceFeeInput = feeService !== undefined
          ? feeService
          : parseInt(serverConfig.MINTING_SERVICE_FEE_FIXED_SATS, 10);
        const serviceFeeAddrInput = feeServiceAddress !== undefined
          ? feeServiceAddress
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

        // Process PSBT using shared service
        const processedPSBT = await PSBTService.processCounterpartyPSBT(
          response.result.psbt,
          address, // userAddress for change
          normalizedFees.normalizedSatsPerVB, // Pass satsPerVB directly
          false, // isDryRun
          processPsbtOptions, // Pass options with conditional serviceFeeDetails
        );

        return ResponseUtil.success(processedPSBT);
      } catch (error) {
        if (
          error instanceof Error && error.message.includes("Insufficient BTC")
        ) {
          return ResponseUtil.badRequest(error.message);
        }
        throw error;
      }
    } catch (error) {
      console.error("Error composing fairmint transaction:", error);
      return ResponseUtil.internalError(
        error,
        "Failed to compose fairmint transaction",
      );
    }
  },
};
