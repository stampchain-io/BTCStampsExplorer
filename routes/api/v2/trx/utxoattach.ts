import { Handlers } from "$fresh/server.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { XcpManager } from "$server/services/xcpService.ts";
import { PSBTService } from "$server/services/transaction/psbtService.ts";

interface UtxoAttachInput {
  address: string;
  asset: string;
  quantity: number;
  utxo: string;
  options: {
    return_psbt: boolean;
    extended_tx_info: boolean;
    regular_dust_size: number;
    fee_per_kb: number;
  };
}

export const handler: Handlers = {
  async POST(req: Request) {
    try {
      const input: UtxoAttachInput = await req.json();
      console.log("Received input:", input);

      const { address, asset, quantity, utxo, options } = input;

      // Validate fee rate
      if (typeof options?.fee_per_kb !== "number" || options.fee_per_kb <= 0) {
        return ResponseUtil.error("Invalid fee rate", 400);
      }

      const feeRateKB = options.fee_per_kb;
      console.log(`Fee rate (sat/kB): ${feeRateKB}`);

      try {
        // Call composeAttach with fee rate in sat/kB
        const response = await XcpManager.composeAttach(
          address,
          asset,
          quantity,
          {
            ...options,
            destination: utxo,
            fee_per_kb: feeRateKB,
          },
        );

        if (!response?.result?.psbt) {
          if (response?.error) {
            return ResponseUtil.error(response.error, 400);
          }
          throw new Error("Failed to compose attach transaction.");
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
      console.error("Error processing utxo attach request:", error);
      return ResponseUtil.handleError(
        error,
        "Failed to process utxo attach request",
      );
    }
  },
};
