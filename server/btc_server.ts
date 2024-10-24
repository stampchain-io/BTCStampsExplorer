import { Psbt, Transaction, payments, networks } from "bitcoin";
import { Buffer } from "buffer";
import { getBtcAddressInfo, fetchBTCPriceInUSD } from "../lib/utils/btc.ts";

export async function createPSBT(
  utxo: string,
  salePrice: number,
  sellerAddress: string,
): Promise<string> {
  const [txid, voutStr] = utxo.split(":");
  const vout = parseInt(voutStr, 10);

  const network = getAddressNetwork(sellerAddress);
  const psbt = new Psbt({ network });

  // Fetch detailed UTXO information
  const utxoDetails = await fetchDetailedUTXO(txid, vout);
  console.log("UTXO Details:", utxoDetails);  // Log UTXO details for debugging

  if (!utxoDetails || !utxoDetails.value || !utxoDetails.scriptPubKey) {
    throw new Error(`Invalid UTXO details for ${txid}:${vout}`);
  }

  const inputAmount = utxoDetails.value;

  const input: any = {
    hash: txid,
    index: vout,
    sequence: 0xfffffffd, // Enable RBF
    witnessUtxo: {
      script: Buffer.from(utxoDetails.scriptPubKey, 'hex'),
      value: inputAmount,
    },
    sighashType: Transaction.SIGHASH_ALL,
  };

  // Only add nonWitnessUtxo if hex is available
  if (utxoDetails.hex) {
    input.nonWitnessUtxo = Buffer.from(utxoDetails.hex, 'hex');
  }

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

async function fetchDetailedUTXO(txid: string, vout: number) {
  const response = await fetch(`https://mempool.space/api/tx/${txid}`);
  if (!response.ok) {
    throw new Error(`Failed to fetch UTXO details for ${txid}`);
  }
  const txData = await response.json();
  console.log("Fetched TX Data:", txData);  // Log the fetched data

  const output = txData.vout[vout];
  if (!output) {
    throw new Error(`Invalid vout index ${vout} for transaction ${txid}`);
  }

  return {
    value: output.value,
    scriptPubKey: output.scriptpubkey,
    hex: txData.hex,  // This might be undefined for some APIs
  };
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


export async function completePSBT(sellerPsbtHex: string, buyerUtxo: string, buyerAddress: string): Promise<string> {
  const psbt = Psbt.fromHex(sellerPsbtHex);
  const [txid, vout] = buyerUtxo.split(":");

  // Add buyer's input
  psbt.addInput({
    hash: txid,
    index: parseInt(vout),
    sequence: 0xfffffffd, // Enable RBF
  });

  // Add buyer's change output (you'll need to calculate the change amount)
  psbt.addOutput({
    address: buyerAddress,
    value: calculateChangeAmount(), // Implement this function
  });

  return psbt.toHex();
}
