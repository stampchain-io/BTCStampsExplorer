import { Psbt, Transaction, payments, networks } from "bitcoinjs-lib";
import { UTXOService } from "./utxoService.ts";
import { getUTXOForAddress } from "$lib/utils/utxoUtils.ts";
import { estimateFee } from "$lib/utils/minting/feeCalculations.ts";
import { TX_CONSTANTS } from "$lib/utils/minting/constants.ts";
import { getScriptTypeInfo } from "$lib/utils/scriptTypeUtils.ts";
import { SATS_PER_KB_MULTIPLIER } from "$lib/utils/constants.ts";
import { hex2bin } from "$lib/utils/binary/baseUtils.ts";


export function formatPsbtForLogging(psbt: bitcoin.Psbt) {
  return {
      inputs: psbt.data.inputs.map(input => ({
          witnessUtxo: input.witnessUtxo ? {
              value: Number(input.witnessUtxo.value),
              script: input.witnessUtxo.script.toString('hex')
          } : undefined,
      })),
      outputs: psbt.txOutputs.map(output => ({
          address: output.address,
          value: Number(output.value)
      })),
  };
}

export class PSBTService {
  static async createPSBT(
    utxo: string,
    salePrice: number,
    sellerAddress: string,
  ): Promise<string> {
    const [txid, voutStr] = utxo.split(":");
    const vout = parseInt(voutStr, 10);

    const network = getAddressNetwork(sellerAddress);
    const psbt = new Psbt({ network });

    // Fetch specific UTXO details (no ancestor info needed)
    const txInfo = await getUTXOForAddress(sellerAddress, txid, vout);
    if (!txInfo?.utxo) {
      throw new Error(`Invalid UTXO details for ${txid}:${vout}`);
    }
    const utxoDetails = txInfo.utxo;
    console.log("UTXO Details:", utxoDetails);

    if (!utxoDetails || !utxoDetails.value || !utxoDetails.script) {
      throw new Error(`Invalid UTXO details for ${txid}:${vout}`);
    }

    const inputAmount = utxoDetails.value;

    const input: any = {
      hash: txid,
      index: vout,
      sequence: 0xfffffffd, // Enable RBF
      witnessUtxo: {
        script: new Uint8Array(hex2bin(utxoDetails.script)), // Use hex2bin and be explicit with Uint8Array
        value: BigInt(inputAmount), // Use BigInt for values
      },
      sighashType: Transaction.SIGHASH_SINGLE | Transaction.SIGHASH_ANYONECANPAY,
    };

    // Add input
    psbt.addInput(input);

    // Add output for sale price
    const salePriceSats = BigInt(Math.round(salePrice * 1e8)); // Use BigInt
    psbt.addOutput({
      address: sellerAddress,
      value: salePriceSats,
    });

    const addressType = getAddressType(sellerAddress, network);
    
    if (addressType === 'p2sh-p2wpkh') {
      const p2wpkh = payments.p2wpkh({ address: sellerAddress, network });
      const p2sh = payments.p2sh({ redeem: p2wpkh, network });
      if (p2sh.redeem?.output) {
        psbt.updateInput(0, { 
          redeemScript: new Uint8Array(p2sh.redeem.output) // Be explicit with Uint8Array
        });
      }
    }

    // Return the PSBT as a hex string
    return psbt.toHex();
  }
  // Change from standalone function to static class method
  private static getPubkeyFromAddress(address: string): Uint8Array {
    // Implementation depends on how you're managing keys
    throw new Error('Not implemented');
  }

  // Make sure all helper functions are static class methods
  private static getAddressType(address: string, network: networks.Network): string {
    try {
      bitcoin.address.toOutputScript(address, network);
      return 'p2pkh';
    } catch (error) {
      try {
        payments.p2wpkh({ address, network });
        return 'p2wpkh';
      } catch (error) {
        try {
          payments.p2sh({
            redeem: payments.p2wpkh({ address, network }),
            network,
          });
          return 'p2sh-p2wpkh';
        } catch (error) {
          throw new Error('Unsupported address type');
        }
      }
    }
  }

  private static getAddressNetwork(btcAddress: string) {
    try {
      payments.p2wpkh({ address: btcAddress, network: networks.bitcoin });
      return networks.bitcoin;
    } catch {
      try {
        payments.p2wpkh({ address: btcAddress, network: networks.testnet });
        return networks.testnet;
      } catch {
        throw new Error("Invalid Bitcoin address");
      }
    }
  }

  private static getAddressFromScript(script: Uint8Array, network: networks.Network): string {
    const payment = payments.p2wpkh({ output: script, network });
    if (!payment.address) {
      throw new Error("Failed to derive address from script");
    }
    return payment.address;
  }

  static async validateUTXOOwnership(
    utxo: string,
    address: string,
  ): Promise<boolean> {
    try {
      const [txid, voutStr] = utxo.split(":");
      const vout = parseInt(voutStr, 10);

      // Use getUTXOForAddress with specific UTXO lookup and failover
      const txInfo = await getUTXOForAddress(address, txid, vout);
      if (!txInfo?.utxo) return false;

      // Get the scriptPubKey hex
      const scriptPubKeyHex = txInfo.utxo.script;
      if (!scriptPubKeyHex) {
        throw new Error("Missing scriptPubKey in transaction output");
      }

      // Convert scriptPubKey to address using Uint8Array
      const network = this.getAddressNetwork(address);
      const scriptPubKey = new Uint8Array(hex2bin(scriptPubKeyHex));

      let derivedAddress: string;
      try {
        // Try P2PKH
        derivedAddress = bitcoin.address.fromOutputScript(scriptPubKey, network);
      } catch (e) {
        try {
          // Try P2WPKH or other script types
          derivedAddress = bitcoin.address.fromOutputScript(scriptPubKey, network);
        } catch (e) {
          // Unsupported script type
          throw new Error("Unsupported script type in UTXO");
        }
      }

      // Compare the derived address with the provided address
      return derivedAddress === address;

    } catch (error) {
      console.error("Error in validateUTXOOwnership:", error);
      return false;
    }
  }

  static async completePSBT(
    sellerPsbtHex: string,
    buyerUtxoString: string,
    buyerAddress: string,
    feeRate: number,
  ): Promise<string> {
    console.log(`Starting completePSBT with feeRate: ${feeRate} sat/vB`);

    const network = getAddressNetwork(buyerAddress);

    // Parse the seller's PSBT
    const psbt = Psbt.fromHex(sellerPsbtHex, { network });

    // **Validate Seller's UTXO**
    const sellerTxInput = psbt.txInputs[0];
    if (!sellerTxInput) {
      throw new Error("Seller's txInput not found in PSBT");
    }

    // Extract seller's input details
    const sellerInputTxid = Array.from(sellerTxInput.hash)
      .reverse()
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
    const sellerInputVout = sellerTxInput.index;

    // Get seller's address from witnessUtxo
    const sellerWitnessUtxo = psbt.data.inputs[0].witnessUtxo;
    if (!sellerWitnessUtxo) {
      throw new Error("Seller's witnessUtxo not found");
    }

    const sellerAddress = getAddressFromScript(
      new Uint8Array(sellerWitnessUtxo.script), // Be explicit with Uint8Array
      network
    );

    // Validate seller's UTXO
    const sellerUtxoInfo = await getUTXOForAddress(
      sellerAddress,
      sellerInputTxid,
      sellerInputVout,
    );

    if (!sellerUtxoInfo || !sellerUtxoInfo.utxo) {
      throw new Error("Seller's UTXO not found or already spent");
    }

    // **Process Buyer's UTXO**
    const [buyerTxid, buyerVoutStr] = buyerUtxoString.split(":");
    const buyerVout = parseInt(buyerVoutStr, 10);

    // Validate buyer's UTXO
    const buyerUtxoInfo = await getUTXOForAddress(
      buyerAddress,
      buyerTxid,
      buyerVout,
    );

    if (!buyerUtxoInfo || !buyerUtxoInfo.utxo) {
      throw new Error("Buyer's UTXO not found or already spent");
    }

    const buyerUtxo = buyerUtxoInfo.utxo;

    if (!buyerUtxo.script || buyerUtxo.value === undefined) {
      throw new Error("Incomplete buyer UTXO data.");
    }

    // Add buyer's input to the PSBT
    psbt.addInput({
      hash: buyerTxid,
      index: buyerVout,
      witnessUtxo: {
        script: new Uint8Array(hex2bin(buyerUtxo.script)), // Use hex2bin and be explicit
        value: BigInt(buyerUtxo.value), // Use BigInt
      },
    });

    // **Calculate Total Input and Output Values**
    const totalInputValue = psbt.data.inputs.reduce(
      (sum, input) => sum + BigInt(input.witnessUtxo?.value || 0),
      BigInt(0)
    );

    const totalOutputValue = psbt.txOutputs.reduce(
      (sum, output) => sum + BigInt(output.value),
      BigInt(0)
    );

    // **Prepare Outputs Array for Fee Estimation**
    const outputs = psbt.txOutputs.map((output) => {
      return {
        script: output.script.toString("hex"),
        value: output.value,
      };
    });

    // **Estimate the Fee**
    const estimatedFee = estimateFee(
      outputs,
      feeRate,
      psbt.txInputs.length,
      getScriptTypeInfo(buyerUtxo.script).type
    );

    // **Calculate Change**
    const changeValue = totalInputValue - totalOutputValue - BigInt(estimatedFee);

    if (changeValue < 0) {
      throw new Error("Insufficient funds to cover outputs and fees.");
    }

    // **Add Change Output if Necessary**
    if (changeValue > 0) {
      psbt.addOutput({
        address: buyerAddress,
        value: changeValue,
      });
    }

    // Return the updated PSBT hex without signing
    return psbt.toHex();
  }

  static async processCounterpartyPSBT(
    psbtBase64: string,
    address: string, 
    feeRateKB: number,
    options?: {
      validateInputs?: boolean;
      validateFees?: boolean;
    }
  ): Promise<{
    psbt: string;
    inputsToSign: { index: number }[];
  }> {
    console.log("Processing Counterparty PSBT:", {
      psbtBase64,
      address,
      feeRateKB,
      options
    });

    try {
      // Parse PSBT from Base64
      const psbt = Psbt.fromBase64(psbtBase64);
      console.log("Raw PSBT Data:", psbt.data);

      // Access transaction data
      const tx = psbt.data.globalMap.unsignedTx.tx;
      console.log("Transaction Data:", tx);

      if (!tx || !tx.ins || !tx.outs) {
        throw new Error("Invalid transaction structure in PSBT");
      }

      // Add UTXO details for each input
      const ancestorInfos = [];
      for (const [index, input] of tx.ins.entries()) {
        const inputTxid = Array.from(input.hash)
          .reverse()
          .map(b => b.toString(16).padStart(2, "0"))
          .join("");
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
        ancestorInfos.push(ancestorInfo);

        console.log(`UTXO Details for input ${index}:`, utxoDetails);
        if (ancestorInfo) {
          console.log(`Ancestor info for input ${index}:`, ancestorInfo);
        }

        if (!utxoDetails.script) {
          throw new Error(`Missing script for input ${index}`);
        }

        // Update input with witness UTXO using Uint8Array
        psbt.updateInput(index, {
          witnessUtxo: {
            script: new Uint8Array(hex2bin(utxoDetails.script)),
            value: BigInt(utxoDetails.value),
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

      // Calculate and validate fees using BigInt
      const totalIn = tx.ins.reduce((sum, _, index) => {
        const witnessUtxo = psbt.data.inputs[index]?.witnessUtxo;
        return sum + BigInt(witnessUtxo?.value || 0);
      }, BigInt(0));

      const vsize = tx.virtualSize();
      const requestedFeeRateVB = feeRateKB / SATS_PER_KB_MULTIPLIER;
      const targetFee = BigInt(Math.ceil(vsize * requestedFeeRateVB));

      // Find the change output (usually the last non-OP_RETURN output)
      const changeOutputIndex = tx.outs.findIndex((output, index, arr) => {
        // Skip OP_RETURN outputs
        if (output.script[0] === 0x6a) return false;
        // If this is the last non-OP_RETURN output, it's likely the change
        return !arr.slice(index + 1).some(out => out.script[0] !== 0x6a);
      });

      if (changeOutputIndex === -1) {
        throw new Error("No change output found to adjust fee");
      }

      // Calculate the required change value to achieve target fee using BigInt
      const nonChangeOutputsTotal = tx.outs.reduce((sum, output, index) => 
        index !== changeOutputIndex ? sum + BigInt(output.value) : sum, BigInt(0));
      
      const newChangeValue = totalIn - nonChangeOutputsTotal - targetFee;

      if (newChangeValue < BigInt(546)) { // Dust limit
        throw new Error(`Cannot achieve target fee rate: change would be dust (${newChangeValue} sats)`);
      }

      // Update the change output with the new value
      tx.outs[changeOutputIndex].value = Number(newChangeValue);

      // Recalculate actual fee after adjustment
      const totalOut = tx.outs.reduce((sum, output) => sum + BigInt(output.value), BigInt(0));
      const actualFee = totalIn - totalOut;

      console.log(`
Fee Adjustment:
Original Change Value: ${tx.outs[changeOutputIndex].value}
New Change Value: ${newChangeValue}
Target Fee: ${targetFee} sats (${requestedFeeRateVB} sat/vB)
Actual Fee: ${actualFee} sats (${(actualFee/vsize).toFixed(2)} sat/vB)
      `);

      // Validate fees if requested
      if (options?.validateFees) {
        // Check ancestor fee rates
        for (const [index, ancestorInfo] of ancestorInfos.entries()) {
          if (ancestorInfo) {
            const effectiveFeeRate = (actualFee + ancestorInfo.fees) /
              (vsize + ancestorInfo.vsize);

            console.log(`
Ancestor Fee Analysis for Input ${index}:
Ancestor Fees: ${ancestorInfo.fees} satoshis
Ancestor vSize: ${ancestorInfo.vsize} vBytes
Current Tx:
  Fee: ${actualFee} satoshis
  vSize: ${vsize} vBytes
Combined:
  Total Fees: ${actualFee + ancestorInfo.fees} satoshis
  Total vSize: ${vsize + ancestorInfo.vsize} vBytes
  Effective Fee Rate: ${effectiveFeeRate.toFixed(2)} sat/vB
Target Fee Rate: ${requestedFeeRateVB} sat/vB
            `);

            // If ancestors require higher fee rate, adjust the fee again
            if (effectiveFeeRate < requestedFeeRateVB) {
              const requiredFee = Math.ceil(
                requestedFeeRateVB * (vsize + ancestorInfo.vsize) -
                ancestorInfo.fees
              );

              const adjustedChangeValue = totalIn - nonChangeOutputsTotal - requiredFee;
              if (adjustedChangeValue < 546) {
                throw new Error(
                  `Cannot achieve target fee rate with ancestors: change would be dust (${adjustedChangeValue} sats)`
                );
              }

              // Update change output with adjusted value
              tx.outs[changeOutputIndex].value = adjustedChangeValue;
              console.log(`
Adjusted for ancestors:
New Change Value: ${adjustedChangeValue}
Required Fee: ${requiredFee} sats
              `);
            }
          }
        }
      }

      // Identify inputs to sign
      const inputsToSign = tx.ins.map((_, index) => ({ index }));
      console.log("Inputs to sign:", inputsToSign);

      // Convert updated PSBT to hex
      const updatedPsbtHex = psbt.toHex();
      console.log("Updated PSBT Hex:", updatedPsbtHex);

      return {
        psbt: updatedPsbtHex,
        inputsToSign,
      };
    } catch (error) {
      console.error("Error processing Counterparty PSBT:", error);
      throw new Error(
        `Failed to process PSBT: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
      );
    }
  }
}
