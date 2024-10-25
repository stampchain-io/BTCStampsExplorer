import { Psbt, Transaction, payments, networks, TxOutput } from "bitcoinjs-lib";
import { Buffer } from "buffer";
import { getBtcAddressInfo, fetchBTCPriceInUSD } from "../lib/utils/btc.ts";
import { estimateInputSize, estimateVoutSize } from "$server/utils/utxoSelector.ts";
import { getUTXOForAddress } from "$lib/utils/utxoUtils.ts";
import { estimateFee } from "utils/minting/feeCalculations.ts";
import * as crypto from "crypto";

export async function createPSBT(
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

// Helper function to get pubkey from address (you'll need to implement this)
function getPubkeyFromAddress(address: string): Buffer {
  // Implementation depends on how you're managing keys
  // This might involve querying a wallet or key management system
  throw new Error('Not implemented');
}

// Helper function to determine address type
function getAddressType(address: string, network: networks.Network): string {
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



function getAddressNetwork(btcAddress: string) {
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

export async function validateUTXOOwnership(
  utxo: string,
  address: string,
): Promise<boolean> {
  try {
    // Parse UTXO
    const [txid, voutStr] = utxo.split(":");
    const vout = parseInt(voutStr, 10);

    // Fetch the transaction details from a blockchain explorer API
    const response = await fetch(`https://mempool.space/api/tx/${txid}`);
    if (!response.ok) {
      throw new Error("Failed to fetch transaction details");
    }
    const txData = await response.json();

    // Get the output at the specified vout index
    const output = txData.vout[vout];
    if (!output) {
      throw new Error("Invalid vout index");
    }

    // Get the scriptPubKey hex
    const scriptPubKeyHex = output.scriptpubkey;
    if (!scriptPubKeyHex) {
      throw new Error("Missing scriptPubKey in transaction output");
    }

    // Convert scriptPubKey to address
    const network = getAddressNetwork(address);
    const scriptPubKeyBuffer = Buffer.from(scriptPubKeyHex, "hex");
    const scriptPubKey = scriptPubKeyBuffer;

    let derivedAddress: string;
    try {
      // Try P2PKH
      derivedAddress = btcAddress.fromOutputScript(scriptPubKey, network);
    } catch (e) {
      try {
        // Try P2WPKH or other script types
        derivedAddress = btcAddress.fromOutputScript(scriptPubKey, network);
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

export async function completePSBT(
  sellerPsbtHex: string,
  buyerUtxo: string,
  buyerAddress: string,
  feeRate: number,
): Promise<string> {
  console.log(`Starting completePSBT with feeRate: ${feeRate} sat/vB`);

  const sellerPsbt = Psbt.fromHex(sellerPsbtHex);
  const network = networks.bitcoin; // Use the appropriate network

  // Extract seller's input and partial signatures
  const sellerInput = sellerPsbt.data.inputs[0];
  const sellerTxInput = sellerPsbt.txInputs[0]; // Correctly get hash and index
  const sellerOutput = sellerPsbt.txOutputs[0];

  const sellerInputValue = sellerInput.witnessUtxo?.value;

  if (!sellerInput.witnessUtxo || sellerInputValue === undefined) {
    throw new Error("Invalid seller input: missing witness UTXO value");
  }

  console.log(`Seller input value: ${sellerInputValue} sats`);

  // Parse buyer's UTXO
  const [txid, voutStr] = buyerUtxo.split(":");
  const vout = parseInt(voutStr, 10);

  // Fetch buyer's UTXO details
  const txInfo = await getUTXOForAddress(buyerAddress, txid, vout, true);

  if (!txInfo || !txInfo.utxo) {
    throw new Error(`UTXO ${buyerUtxo} not found for address ${buyerAddress}`);
  }

  const buyerInputValue = txInfo.utxo.value;
  console.log(`Buyer input value: ${buyerInputValue} sats`);

  // Create a new PSBT
  const psbt = new Psbt({ network });

  // Add seller's input, including their partial signature
  psbt.addInput({
    hash: sellerTxInput.hash.toString('hex'), // Ensure hash is in hex string format
    index: sellerTxInput.index,
    witnessUtxo: sellerInput.witnessUtxo,
    sighashType: Transaction.SIGHASH_SINGLE | Transaction.SIGHASH_ANYONECANPAY,
    partialSig: sellerInput.partialSig,
  });

  // Add buyer's input
  psbt.addInput({
    hash: txid,
    index: vout,
    witnessUtxo: {
      script: Buffer.from(txInfo.utxo.script, "hex"),
      value: buyerInputValue,
    },
    sequence: 0xfffffffd, // Enable RBF
    sighashType: Transaction.SIGHASH_SINGLE | Transaction.SIGHASH_ANYONECANPAY,
  });

  // Calculate fees and outputs
  const salePrice = sellerOutput.value;

  // Estimate transaction size
  const inputSize = estimateInputSize("P2WPKH") * 2; // Seller and buyer inputs
  const outputSize = estimateVoutSize("P2WPKH") * 2; // Seller's output and buyer's change
  const txSize = inputSize + outputSize + 10; // Approximate transaction size
  const calculatedFee = Math.ceil(feeRate * txSize);

  const totalInputs = sellerInputValue + buyerInputValue;
  const outputsTotal = salePrice;

  const buyerChange = totalInputs - outputsTotal - calculatedFee;

  console.log(`Total inputs: ${totalInputs} sats`);
  console.log(`Sale price (output to seller): ${salePrice} sats`);

  // Add outputs in correct order
  // First, seller's output (must be at the same index as in seller's PSBT)
  psbt.addOutput({
    address: sellerOutput.address ||
      payments.p2wpkh({ pubkey: sellerOutput.script, network }).address,
    value: salePrice,
  });

  // If buyer has change, add buyer's change output
  if (buyerChange > 546) { // Dust threshold
    psbt.addOutput({
      address: buyerAddress,
      value: buyerChange,
    });
    console.log(`Added buyer change output: ${buyerChange} sats`);
  } else {
    console.log(
      `Buyer change (${buyerChange} sats) is below dust threshold, not adding change output.`,
    );
  }

  // Final validation
  const finalInputsTotal = totalInputs;
  const finalOutputsTotal = psbt.txOutputs.reduce(
    (sum, output) => sum + output.value,
    0,
  );
  const finalFee = finalInputsTotal - finalOutputsTotal;

  console.log(`Final fee: ${finalFee} sats`);

  if (finalFee !== calculatedFee) {
    console.warn(
      `Final fee (${finalFee} sats) does not match calculated fee (${calculatedFee} sats).`,
    );
  }

  if (finalOutputsTotal > finalInputsTotal) {
    throw new Error("Outputs exceed inputs after adjustments");
  }

  return psbt.toHex();
}
