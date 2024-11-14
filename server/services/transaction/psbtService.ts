import { Psbt, Transaction, payments, networks } from "bitcoinjs-lib";
import { Buffer } from "buffer";
import { UTXOService } from "./utxoService.ts";
import { getUTXOForAddress } from "$lib/utils/utxoUtils.ts";
import { estimateFee } from "$lib/utils/minting/feeCalculations.ts";
import { BTCAddressService } from "$server/services/btc/addressService.ts";
import { TX_CONSTANTS } from "$lib/utils/minting/constants.ts";
import { getScriptTypeInfo } from "$lib/utils/scriptTypeUtils.ts";

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
        script: Buffer.from(utxoDetails.script, 'hex'),
        value: inputAmount,
      },
      sighashType: Transaction.SIGHASH_SINGLE | Transaction.SIGHASH_ANYONECANPAY,
    };

    // Add input
    psbt.addInput(input);

    // Add output for sale price
    const salePriceSats = Math.round(salePrice * 1e8);
    psbt.addOutput({
      address: sellerAddress,
      value: salePriceSats,
    });

    const addressType = getAddressType(sellerAddress, network);
    
    if (addressType === 'p2sh-p2wpkh') {
      const p2wpkh = payments.p2wpkh({ address: sellerAddress, network });
      const p2sh = payments.p2sh({ redeem: p2wpkh, network });
      psbt.updateInput(0, { redeemScript: p2sh.redeem!.output });
    }

    // Return the PSBT as a hex string
    return psbt.toHex();
  }

  // Change from standalone function to static class method
  private static getPubkeyFromAddress(address: string): Buffer {
    // Implementation depends on how you're managing keys
    throw new Error('Not implemented');
  }

  // Make sure all helper functions are static class methods
  private static getAddressType(address: string, network: networks.Network): string {
    try {
      btcAddress.toOutputScript(address, network);
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

  private static getAddressFromScript(script: Buffer, network: networks.Network): string {
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

      // Convert scriptPubKey to address
      const network = this.getAddressNetwork(address);
      const scriptPubKeyBuffer = Buffer.from(scriptPubKeyHex, "hex");
      const scriptPubKey = scriptPubKeyBuffer;

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
    const sellerInputTxid = Buffer.from(sellerTxInput.hash).reverse().toString("hex");
    const sellerInputVout = sellerTxInput.index;

    // Get seller's address from witnessUtxo
    const sellerWitnessUtxo = psbt.data.inputs[0].witnessUtxo;
    if (!sellerWitnessUtxo) {
      throw new Error("Seller's witnessUtxo not found");
    }

    const sellerAddress = getAddressFromScript(sellerWitnessUtxo.script, network);

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
        script: Buffer.from(buyerUtxo.script, "hex"),
        value: buyerUtxo.value,
      },
    });

    // **Calculate Total Input and Output Values**
    const totalInputValue = psbt.data.inputs.reduce(
      (sum, input) => sum + (input.witnessUtxo?.value || 0),
      0,
    );

    const totalOutputValue = psbt.txOutputs.reduce(
      (sum, output) => sum + output.value,
      0,
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
    const changeValue = totalInputValue - totalOutputValue - estimatedFee;

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
        ancestorInfos.push(ancestorInfo);

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

      const totalOut = tx.outs.reduce((sum, output) => sum + output.value, 0);
      const actualFee = totalIn - totalOut;

      const vsize = tx.virtualSize();
      const requestedFeeRateVB = feeRateKB / SATS_PER_KB_MULTIPLIER;
      const targetFee = Math.ceil(vsize * requestedFeeRateVB);

      console.log(`
Transaction Analysis:
Total Inputs: ${tx.ins.length}
Total Outputs: ${tx.outs.length}
Virtual Size: ${vsize} vBytes
Input Details: ${JSON.stringify(tx.ins.map((input, i) => ({
    index: i,
    txid: Buffer.from(input.hash).reverse().toString("hex"),
    vout: input.index
})), null, 2)}
Output Details: ${JSON.stringify(tx.outs.map((output, i) => ({
    index: i,
    value: output.value,
    scriptType: output.script[0] === 0x6a ? 'OP_RETURN' : 'P2WPKH/P2WSH'
})), null, 2)}

Fee Analysis:
Fee Rate KB: ${feeRateKB} sat/kB
Fee Rate VB: ${requestedFeeRateVB} sat/vB
Total Input: ${totalIn} satoshis
Total Output: ${totalOut} satoshis
Actual Fee: ${actualFee} satoshis
Target Fee: ${targetFee} satoshis
      `);

      // Validate fees if requested
      if (options?.validateFees) {
        // Check base fee rate
        if (Math.abs(actualFee - targetFee) > targetFee * 0.1) { // Allow 10% variance
          throw new Error(
            `Unable to achieve target fee rate. ` +
            `Target: ${requestedFeeRateVB} sat/vB (${targetFee} sats), ` +
            `Actual: ${(actualFee/vsize).toFixed(2)} sat/vB (${actualFee} sats)`
          );
        }

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

            // Calculate required fee to achieve target rate including ancestors
            const requiredFee = Math.ceil(
              requestedFeeRateVB * (vsize + ancestorInfo.vsize) -
              ancestorInfo.fees
            );

            if (requiredFee > actualFee) {
              throw new Error(
                `Cannot achieve target fee rate with ancestors: ` +
                `Need ${requiredFee} sats, have ${actualFee} sats`
              );
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
