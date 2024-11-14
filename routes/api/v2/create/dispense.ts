// routes/api/v2/dispense.ts
import { Handlers } from "$fresh/server.ts";
import { XcpManager } from "$server/services/xcpService.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
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

      // Validate fee rate
      if (typeof options?.fee_per_kb !== "number" || options.fee_per_kb <= 0) {
        return ResponseUtil.error("Invalid fee rate", 400);
      }

      const feeRateKB = options.fee_per_kb;
      console.log(`Fee rate (sat/kB): ${feeRateKB}`);

      try {
        // Get dispense transaction from XcpManager
        const response = await XcpManager.createDispense(
          address,
          dispenser,
          quantity,
          {
            ...options,
            fee_per_kb: feeRateKB,
          },
        );

        if (!response?.result?.psbt) {
          if (response?.error) {
            return ResponseUtil.error(response.error, 400);
          }
          throw new Error("Failed to create dispense transaction.");
        }

        console.log("PSBT Base64 from XCP:", response.result.psbt);

        // Process PSBT using shared service
        const processedPSBT = await PSBTService.processCounterpartyPSBT(
          response.result.psbt,
          address,
          feeRateKB,
          { validateInputs: true, validateFees: true },
        );

        return new Response(JSON.stringify(processedPSBT), {
          headers: { "Content-Type": "application/json" },
        });
      } catch (error) {
        if (
          error instanceof Error && error.message.includes("Insufficient BTC")
        ) {
          return ResponseUtil.error(error.message, 400);
        }
        throw error;
      }
    } catch (error) {
      console.error("Error processing dispense request:", error);
      return ResponseUtil.handleError(
        error,
        "Failed to process dispense request",
      );
    }
  },
};
