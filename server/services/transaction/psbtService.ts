import { Psbt, Transaction, payments, networks } from "bitcoinjs-lib";
import { Buffer } from "buffer";
import { UTXOService } from "./utxoService.ts";
import { getUTXOForAddress } from "$lib/utils/utxoUtils.ts";
import { estimateFee } from "$lib/utils/minting/feeCalculations.ts";
import { BTCAddressService } from "$server/services/btc/addressService.ts";

export class PSBTService {
  static async createPSBT(
    utxo: string,
    salePrice: number,
    sellerAddress: string,
  ): Promise<string> {
    const [txid, voutStr] = utxo.split(":");
    const vout = parseInt(voutStr, 10);

    const network = getAddressNetwork(sellerAddress);
    // Create PSBT instance first
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
    const estimatedFee = estimateFee(outputs, feeRate);

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
}
