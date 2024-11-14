// routes/api/v2/dispense.ts
import { Handlers } from "$fresh/server.ts";
import { XcpManager } from "$server/services/xcpService.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { Psbt } from "bitcoinjs-lib";
import { getUTXOForAddress } from "$lib/utils/utxoUtils.ts";
import { Buffer } from "buffer";

const SATS_PER_KB_MULTIPLIER = 1000; // Convert vB to kB

interface DispenseInput {
  address: string;
  dispenser: string;
  quantity: number;
  options: {
    return_psbt: boolean;
    fee_per_kb: number;
  };
}

interface DispenseResponse {
  psbt: string;
  inputsToSign: { index: number }[];
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

        try {
          // Parse PSBT from Base64
          const psbt = Psbt.fromBase64(response.result.psbt);
          console.log("Raw PSBT Data:", psbt.data);

          // Access transaction data
          const tx = psbt.data.globalMap.unsignedTx.tx;
          console.log("Transaction Data:", tx);

          if (!tx || !tx.ins || !tx.outs) {
            throw new Error("Invalid transaction structure in PSBT");
          }

          // Add UTXO details for each input
          for (const [index, input] of tx.ins.entries()) {
            const inputTxid = Buffer.from(input.hash).reverse().toString("hex");
            const inputVout = input.index;
            console.log(
              `Processing input ${index}: txid=${inputTxid}, vout=${inputVout}`,
            );

            // Fetch UTXO details WITH ancestor info
            const txInfo = await getUTXOForAddress(
              address,
              inputTxid,
              inputVout,
              true,
            );
            if (!txInfo?.utxo) {
              throw new Error(
                `UTXO details not found for input ${index}: ${inputTxid}:${inputVout}`,
              );
            }

            const utxoDetails = txInfo.utxo;
            const ancestorInfo = txInfo.ancestor;

            console.log(`UTXO Details for input ${index}:`, utxoDetails);
            if (ancestorInfo) {
              console.log(`Ancestor info for input ${index}:`, ancestorInfo);
            }

            if (!utxoDetails.script) {
              throw new Error(`Missing script for input ${index}`);
            }

            // Update input with witness UTXO
            psbt.updateInput(index, {
              witnessUtxo: {
                script: Buffer.from(utxoDetails.script, "hex"),
                value: utxoDetails.value,
              },
            });

            console.log(`Updated input ${index} with witness data`);
          }

          // Verify all inputs have UTXO data
          tx.ins.forEach((_, index) => {
            const inputData = psbt.data.inputs[index];
            console.log(`Input ${index} data:`, inputData);

            if (!inputData.witnessUtxo && !inputData.nonWitnessUtxo) {
              throw new Error(
                `Missing UTXO details for input at index ${index}`,
              );
            }
          });

          // Calculate and validate fees
          const totalIn = tx.ins.reduce((sum, _, index) => {
            const witnessUtxo = psbt.data.inputs[index]?.witnessUtxo;
            return sum + (witnessUtxo?.value || 0);
          }, 0);

          const vsize = tx.virtualSize();
          const requestedFeeRateVB = feeRateKB / SATS_PER_KB_MULTIPLIER;
          const targetFee = Math.ceil(vsize * requestedFeeRateVB);

          console.log(`
Fee Analysis:
Fee Rate KB: ${feeRateKB} sat/kB
Fee Rate VB: ${requestedFeeRateVB} sat/vB
Transaction size: ${vsize} vBytes
Target fee: ${targetFee} satoshis
Total inputs: ${totalIn} satoshis
          `);

          // Identify inputs to sign
          const inputsToSign = tx.ins.map((_, index) => ({ index }));
          console.log("Inputs to sign:", inputsToSign);

          // Convert updated PSBT to hex
          const updatedPsbtHex = psbt.toHex();
          console.log("Updated PSBT Hex:", updatedPsbtHex);

          const res: DispenseResponse = {
            psbt: updatedPsbtHex,
            inputsToSign,
          };

          return new Response(JSON.stringify(res), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          console.error("Error processing PSBT:", error);
          throw new Error(
            `Failed to process PSBT: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          );
        }
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
