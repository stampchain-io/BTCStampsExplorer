import { Psbt, Transaction, payments, networks, TxOutput } from "bitcoinjs-lib";
import { Buffer } from "buffer";
import { getBtcAddressInfo, fetchBTCPriceInUSD } from "$lib/utils/btc.ts";
import { estimateInputSize, estimateVoutSize } from "./utxoSelector.ts";
import { getUTXOForAddress } from "$lib/utils/utxoUtils.ts";
import { estimateFee } from "$lib/utils/minting/feeCalculations.ts";
import * as crypto from "crypto";
import * as ecc from "tiny-secp256k1";


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

// Helper function to get address from scriptPubKey
function getAddressFromScript(script: Buffer, network: networks.Network): string {
  const payment = payments.p2wpkh({ output: script, network });
  if (!payment.address) {
    throw new Error("Failed to derive address from script");
  }
  return payment.address;
}



