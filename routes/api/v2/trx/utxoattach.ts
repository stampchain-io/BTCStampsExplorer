import { Handlers } from "$fresh/server.ts";
import { ResponseUtil } from "utils/responseUtil.ts";
import { XcpManager } from "$lib/services/xcpService.ts";
import { Psbt } from "bitcoinjs-lib";
import { getUTXOForAddress } from "$lib/utils/utxoUtils.ts";
import { Buffer } from "buffer";

// Add constants at the top
const SATS_PER_KB_MULTIPLIER = 1000; // Convert vB to kB

interface UtxoAttachInput {
  address: string;
  asset: string;
  quantity: number;
  utxo: string;
  options: {
    return_psbt: boolean;
    extended_tx_info: boolean;
    regular_dust_size: number;
    fee_per_kb: number; // Now required and in sat/kB
  };
}

interface UtxoAttachResponse {
  psbt: string;
  inputsToSign: { index: number }[];
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

      // Parse UTXO string to get txid and vout
      const [txid, voutStr] = utxo.split(":");
      if (!txid || !voutStr) {
        return ResponseUtil.error(
          "Invalid UTXO format. Expected format: txid:vout",
          400,
        );
      }
      const vout = parseInt(voutStr, 10);
      if (isNaN(vout)) {
        return ResponseUtil.error("Invalid vout value", 400);
      }

      // Fetch UTXO details WITH ancestor info for fee calculation
      const txInfo = await getUTXOForAddress(address, txid, vout, true);
      if (!txInfo?.utxo) {
        throw new Error("UTXO details not found for the provided input.");
      }

      const utxoDetails = txInfo.utxo;
      const ancestorInfo = txInfo.ancestor;

      console.log("UTXO Details:", utxoDetails);

      if (!utxoDetails.script) {
        throw new Error("UTXO script is undefined.");
      }

      // Call composeAttach with fee rate in sat/kB
      try {
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

        if (!response || !response.result || !response.result.psbt) {
          // Check if we have a specific error message
          if (response?.error) {
            return ResponseUtil.error(response.error, 400);
          }
          throw new Error("Failed to compose attach transaction.");
        }

        // Log the PSBT Base64 string
        console.log("PSBT Base64:", response.result.psbt);

        try {
          // Parse PSBT from Base64 for internal processing
          const psbt = Psbt.fromBase64(response.result.psbt);
          console.log("Raw PSBT Data:", psbt.data);

          // Access the transaction data directly
          const tx = psbt.data.globalMap.unsignedTx.tx;
          console.log("Transaction Data:", tx);

          if (!tx || !tx.ins || !tx.outs) {
            throw new Error("Invalid transaction structure in PSBT");
          }

          // Add UTXO details to the PSBT
          tx.ins.forEach((input, index) => {
            const inputTxid = Buffer.from(input.hash).reverse().toString("hex");
            console.log(
              `Checking input ${index}: txid=${inputTxid}, vout=${input.index}`,
            );

            if (inputTxid === txid && input.index === vout) {
              if (!utxoDetails || !utxoDetails.script || !utxoDetails.value) {
                throw new Error(`Missing UTXO details for input ${index}`);
              }

              // Update the input with witness UTXO
              psbt.updateInput(index, {
                witnessUtxo: {
                  script: Buffer.from(utxoDetails.script, "hex"),
                  value: utxoDetails.value,
                },
              });

              console.log(`Updated input ${index} with witness data`);
            }
          });

          // Verify the updates
          tx.ins.forEach((input, index) => {
            const inputData = psbt.data.inputs[index];
            console.log(`Input ${index} data:`, inputData);

            if (!inputData.witnessUtxo && !inputData.nonWitnessUtxo) {
              throw new Error(
                `Missing UTXO details for input at index ${index}`,
              );
            }
          });

          // Identify inputs to sign
          const inputsToSign = tx.ins
            .map((input, index) => {
              const txid = Buffer.from(input.hash).reverse().toString("hex");
              const vout = input.index;
              return txid === txid && vout === vout ? { index } : null;
            })
            .filter((input): input is { index: number } => input !== null);

          if (inputsToSign.length === 0) {
            throw new Error(
              "No inputs to sign were found for the provided UTXO.",
            );
          }

          console.log("Inputs to sign:", inputsToSign);

          // Convert updated PSBT to hex
          const updatedPsbtHex = psbt.toHex();
          console.log("Updated PSBT Hex:", updatedPsbtHex);

          // Prepare response
          const res: UtxoAttachResponse = {
            psbt: updatedPsbtHex,
            inputsToSign,
          };

          // Calculate the actual fee and adjust if needed
          const totalIn = tx.ins.reduce((sum: number, input: any) => {
            const witnessUtxo = psbt.data.inputs[tx.ins.indexOf(input)]
              ?.witnessUtxo;
            return sum + (witnessUtxo?.value || 0);
          }, 0);

          const vsize = tx.virtualSize();
          const requestedFeeRateVB = feeRateKB / SATS_PER_KB_MULTIPLIER;
          const targetFee = Math.ceil(vsize * requestedFeeRateVB);

          // Get the OP_RETURN output (should be first output)
          const opReturnOutput = tx.outs[0];
          if (!opReturnOutput.script.toString("hex").startsWith("6a")) {
            throw new Error("First output must be OP_RETURN");
          }

          // Get the change output (should be second output)
          const changeOutput = tx.outs[1];
          if (!changeOutput || changeOutput.value <= 546) {
            throw new Error("Invalid change output or below dust limit");
          }

          // Calculate the new change amount to achieve desired fee rate
          const newChangeAmount = totalIn - targetFee;
          if (newChangeAmount <= 546) {
            throw new Error(
              `Adjusting for fee rate would result in dust change output (${newChangeAmount} sats)`,
            );
          }

          // Update the change output with new value
          changeOutput.value = newChangeAmount;

          // Recalculate actual fee after adjustment
          const totalOut = tx.outs.reduce((sum: number, output: any) => {
            return sum + (output.value || 0);
          }, 0);

          const adjustedFee = totalIn - totalOut;
          const achievedFeeRate = adjustedFee / vsize;

          console.log(`
Fee Analysis:
Fee Rate KB: ${feeRateKB} sat/kB (from frontend)
Fee Rate VB: ${requestedFeeRateVB} sat/vB (converted back)
Transaction size: ${vsize} vBytes
Target fee: ${targetFee} satoshis
Adjusted fee: ${adjustedFee} satoshis
Fee rate achieved: ${achievedFeeRate.toFixed(2)} sat/vB

Transaction Details:
Total Input: ${totalIn} satoshis
OP_RETURN Output: 0 satoshis
Change Output: ${newChangeAmount} satoshis
`);

          // Validate the adjusted fee
          if (Math.abs(adjustedFee - targetFee) > targetFee * 0.1) { // Allow 10% variance
            throw new Error(
              `Unable to achieve target fee rate. ` +
                `Target: ${requestedFeeRateVB} sat/vB (${targetFee} sats), ` +
                `Achieved: ${
                  achievedFeeRate.toFixed(2)
                } sat/vB (${adjustedFee} sats)`,
            );
          }

          // Check ancestor fee rate if available
          if (ancestorInfo) {
            const effectiveFeeRate = (adjustedFee + ancestorInfo.fees) /
              (vsize + ancestorInfo.vsize);

            console.log(`
Ancestor Fee Analysis:
Ancestor Fees: ${ancestorInfo.fees} satoshis
Ancestor vSize: ${ancestorInfo.vsize} vBytes
Current Transaction:
  Fee: ${adjustedFee} satoshis
  vSize: ${vsize} vBytes
Combined:
  Total Fees: ${adjustedFee + ancestorInfo.fees} satoshis
  Total vSize: ${vsize + ancestorInfo.vsize} vBytes
  Effective Fee Rate: ${effectiveFeeRate.toFixed(2)} sat/vB
Target Fee Rate: ${requestedFeeRateVB} sat/vB
          `);

            // Calculate required fee to achieve target rate including ancestors
            const requiredFee = Math.ceil(
              requestedFeeRateVB * (vsize + ancestorInfo.vsize) -
                ancestorInfo.fees,
            );

            if (requiredFee > adjustedFee) {
              const additionalFeeNeeded = requiredFee - adjustedFee;
              console.log(
                `Need additional fee: ${additionalFeeNeeded} satoshis`,
              );

              // Check if we can increase the fee
              const newChangeAmount = totalIn - requiredFee;
              if (newChangeAmount <= 546) {
                throw new Error(
                  `Cannot achieve target fee rate: change output would be dust (${newChangeAmount} sats)`,
                );
              }

              // Update change output with new amount
              changeOutput.value = newChangeAmount;
              const finalFee = totalIn - newChangeAmount;

              console.log(`
Fee Adjustment for Ancestors:
Original Fee: ${adjustedFee} satoshis
Required Fee: ${requiredFee} satoshis
Additional Fee: ${additionalFeeNeeded} satoshis
Final Fee: ${finalFee} satoshis
New Change Amount: ${newChangeAmount} satoshis
Expected Effective Fee Rate: ${
                ((finalFee + ancestorInfo.fees) / (vsize + ancestorInfo.vsize))
                  .toFixed(2)
              } sat/vB
              `);
            }
          }

          return new Response(JSON.stringify(res), {
            headers: { "Content-Type": "application/json" },
          });
        } catch (error) {
          console.error("Error parsing PSBT:", error);
          throw new Error(
            `Failed to parse PSBT: ${
              error instanceof Error ? error.message : "Unknown error"
            }`,
          );
        }
      } catch (error) {
        // Pass through specific error messages with appropriate status code
        if (
          error instanceof Error && error.message.includes("Insufficient BTC")
        ) {
          return ResponseUtil.error(error.message, 400); // Use 400 for insufficient funds
        }
        throw error; // Re-throw other errors
      }
    } catch (error) {
      console.error("Error processing utxo attach request:", error);
      return ResponseUtil.error(
        error instanceof Error ? error.message : "Internal Server Error",
        error instanceof Error && error.message.includes("Insufficient BTC in UTXO")
          ? 400 // Use 400 for insufficient funds
          : 500, // Use 500 for other errors
      );
    }
  },
};
