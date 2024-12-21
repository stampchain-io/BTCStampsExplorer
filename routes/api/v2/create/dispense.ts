// routes/api/v2/dispense.ts
import { Handlers } from "$fresh/server.ts";
import { XcpManager } from "$server/services/xcpService.ts";
import { ApiResponseUtil } from "$lib/utils/apiResponseUtil.ts";
import { PSBTService } from "$server/services/transaction/psbtService.ts";

interface DispenseInput {
  address: string;
  dispenser: string;
  quantity: number;
  options: {
    return_psbt: boolean;
    fee_per_kb: number;
  };
}

export const handler: Handlers = {
  async POST(req) {
    try {
      const input: DispenseInput = await req.json();
      console.log("Received dispense input:", input);

      const { address, dispenser, quantity, options } = input;

      // Only validate what's specific to our API endpoint
      if (typeof options?.fee_per_kb !== "number" || options.fee_per_kb <= 0) {
        return ApiResponseUtil.badRequest("Invalid fee rate", {
          field: "fee_per_kb",
        });
      }

      // Add dust size to options
      const dispenserOptions = {
        ...options,
        regular_dust_size: 546,
        allow_unconfirmed_inputs: true,
        validate: true,
      };

      try {
        // Call XcpManager with the enhanced options
        const response = await XcpManager.createDispense(
          address,
          dispenser,
          quantity,
          dispenserOptions,
        );

        if (!response) {
          return ApiResponseUtil.serviceUnavailable(
            "XCP service unavailable",
            { service: "XCP" },
          );
        }

        if (response.error) {
          return ApiResponseUtil.badRequest(response.error, {
            service: "XCP",
            dispenser,
            quantity,
          });
        }

        if (!response?.result?.psbt) {
          return ApiResponseUtil.badRequest(
            "Failed to create dispense transaction: No PSBT returned",
            { service: "XCP", dispenser },
          );
        }

        // Process PSBT using shared service
        const processedPSBT = await PSBTService.processCounterpartyPSBT(
          response.result.psbt,
          address,
          options.fee_per_kb,
          { validateInputs: true, validateFees: true },
        );

        if (!processedPSBT) {
          return ApiResponseUtil.serviceUnavailable(
            "PSBT service unavailable",
            { service: "PSBT" },
          );
        }

        return ApiResponseUtil.success(processedPSBT);
      } catch (error: unknown) {
        // Pass through the specific error message from XcpManager or PSBTService
        const errorMessage = error instanceof Error
          ? error.message
          : "Unknown error";
        return ApiResponseUtil.badRequest(errorMessage, {
          service: "XCP",
          dispenser,
          quantity,
          details: error instanceof Error ? error.stack : undefined,
        });
      }
    } catch (error: unknown) {
      console.error("Error processing dispense request:", error);
      const errorMessage = error instanceof Error
        ? error.message
        : "Invalid request format";
      return ApiResponseUtil.badRequest(errorMessage, {
        error: error instanceof Error ? error.stack : "Unknown error",
      });
    }
  },
};
