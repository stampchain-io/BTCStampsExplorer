// lib/utils/minting/src20/tx.ts

import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import * as crypto from "crypto";
import { Buffer } from "buffer";
import { selectUTXOs } from "./utxo-selector.ts";
import { arc4, bin2hex, hex2bin } from "../utils.ts";
import { compressWithCheck } from "../zlib.ts";
import { serverConfig } from "$server/config/config.ts";
import { IPrepareSRC20TX, PSBTInput, VOUT } from "$lib/types/src20.d.ts";
import { getTransaction } from "../../quicknode.ts";
import { getUTXOForAddress } from "./utils.ts";
import * as msgpack from "https://deno.land/x/msgpack@v1.4/mod.ts";

const RECIPIENT_DUST = 789;
const MULTISIG_DUST = 809;
const CHANGE_DUST = 1000;
const THIRD_PUBKEY =
  "020202020202020202020202020202020202020202020202020202020202020202";

export const prepareSrc20TX = async ({
  network,
  changeAddress,
  toAddress,
  feeRate,
  transferString,
  enableRBF = true,
}: IPrepareSRC20TX) => {
  try {
    console.log("Starting prepareSrc20TX");
    const psbtNetwork = network === "testnet"
      ? bitcoin.networks.testnet
      : bitcoin.networks.bitcoin;
    console.log("Using network:", psbtNetwork);

    const psbt = new bitcoin.Psbt({ network: psbtNetwork });

    // Fetch UTXOs
    const utxos = await getUTXOForAddress(changeAddress);
    if (!utxos || utxos.length === 0) {
      throw new Error("No UTXOs found for the given address");
    }

    let transferDataBytes: Uint8Array;
    const stampPrefixBytes = new TextEncoder().encode("stamp:");

    const transferData = JSON.parse(transferString);
    const msgpackData = msgpack.encode(transferData);
    const { compressedData, compressed } = await compressWithCheck(msgpackData);

    if (compressed) {
      // Compression successful
      transferDataBytes = compressedData;
    } else {
      // Compression failed, use original JSON data
      transferDataBytes = new TextEncoder().encode(
        JSON.stringify(transferData),
      );
    }

    // Add stamp prefix
    const dataWithPrefix = new Uint8Array([
      ...stampPrefixBytes,
      ...transferDataBytes,
    ]);

    // Calculate the length of the data (including the "stamp:" prefix)
    // but excluding any trailing null bytes
    let dataLength = dataWithPrefix.length;
    while (dataLength > 0 && dataWithPrefix[dataLength - 1] === 0) {
      dataLength--;
    }

    // Add 2-byte length prefix (big-endian)
    const lengthPrefix = new Uint8Array([
      (dataLength >> 8) & 0xff, // High byte
      dataLength & 0xff, // Low byte
    ]);
    console.log("length", lengthPrefix);

    let payloadBytes = new Uint8Array([
      ...lengthPrefix,
      ...dataWithPrefix,
    ]);

    // Pad the data to multiple of 62 bytes
    const padLength = (62 - (payloadBytes.length % 62)) % 62;
    if (padLength > 0) {
      const padding = new Uint8Array(padLength); // zeros
      payloadBytes = new Uint8Array([...payloadBytes, ...padding]);
    }
    console.log("Padded payload:", bin2hex(payloadBytes));

    // ARC4 encode using the first UTXO's txid as the key
    const txidBytes = hex2bin(utxos[0].txid); // Uint8Array
    console.log("ARC4 key (hex):", bin2hex(txidBytes));

    // Use the arc4 function for encryption
    const encryptedDataBytes = arc4(txidBytes, payloadBytes);
    console.log("Encrypted data (hex):", bin2hex(encryptedDataBytes));

    // Split encrypted data into chunks of 62 bytes
    const chunks: Uint8Array[] = [];
    for (let i = 0; i < encryptedDataBytes.length; i += 62) {
      chunks.push(encryptedDataBytes.slice(i, i + 62));
    }

    const multisigScripts = chunks.map((chunk) => {
      const pubkey_seg1 = bin2hex(chunk.slice(0, 31)); // First 31 bytes (62 hex chars)
      const pubkey_seg2 = bin2hex(chunk.slice(31, 62)); // Next 31 bytes (62 hex chars)
      let pubkey1: string, pubkey2: string;

      do {
        const first_byte = Math.random() > 0.5 ? "02" : "03";
        const second_byte = crypto.randomBytes(1)[0]
          .toString(16)
          .padStart(2, "0");
        pubkey1 = first_byte + pubkey_seg1 + second_byte;
      } while (!isValidPubkey(pubkey1));

      do {
        const first_byte = Math.random() > 0.5 ? "02" : "03";
        const second_byte = crypto.randomBytes(1)[0]
          .toString(16)
          .padStart(2, "0");
        pubkey2 = first_byte + pubkey_seg2 + second_byte;
      } while (!isValidPubkey(pubkey2));

      return `5121${pubkey1}21${pubkey2}21${THIRD_PUBKEY}53ae`;
    });

    // Prepare outputs
    const vouts: VOUT[] = [
      { address: toAddress, value: RECIPIENT_DUST },
      ...multisigScripts.map((script) => ({
        script: Buffer.from(script, "hex"),
        value: MULTISIG_DUST,
      })),
    ];

    // Add minting service fee if enabled
    if (parseInt(serverConfig.MINTING_SERVICE_FEE_ENABLED || "0", 10) === 1) {
      const feeAddress = serverConfig.MINTING_SERVICE_FEE_ADDRESS || "";
      const feeAmount = parseInt(
        serverConfig.MINTING_SERVICE_FEE_FIXED_SATS || "0",
        10,
      );
      vouts.push({ address: feeAddress, value: feeAmount });
    }

    // Select UTXOs
    const {
      inputs: selectedUtxos,
      change,
      fee: estimatedFee,
    } = selectUTXOs(utxos, vouts, feeRate);

    if (selectedUtxos.length === 0) {
      throw new Error("Unable to select suitable UTXOs for the transaction");
    }

    // Add inputs to PSBT
    for (const input of selectedUtxos) {
      const txDetails = await getTransaction(input.txid);
      const inputDetails = txDetails.vout[input.vout];
      const isWitnessUtxo = inputDetails.scriptPubKey.type.startsWith(
        "witness",
      );

      const psbtInput: PSBTInput = {
        hash: input.txid,
        index: input.vout,
        sequence: enableRBF ? 0xfffffffd : 0xffffffff, // Set sequence for RBF
      };

      if (isWitnessUtxo) {
        psbtInput.witnessUtxo = {
          script: Buffer.from(inputDetails.scriptPubKey.hex, "hex"),
          value: input.value,
        };
      } else {
        psbtInput.nonWitnessUtxo = Buffer.from(txDetails.hex, "hex");
      }

      psbt.addInput(psbtInput);
    }

    // Add outputs to PSBT
    vouts.forEach((vout) => {
      if ("address" in vout && vout.address) {
        psbt.addOutput({ address: vout.address, value: vout.value });
      } else if ("script" in vout && vout.script) {
        psbt.addOutput({ script: vout.script, value: vout.value });
      }
    });

    // Add change output
    if (change > CHANGE_DUST) {
      psbt.addOutput({ address: changeAddress, value: change });
    }

    const psbtHex = psbt.toHex();

    console.log("Final transaction details:");
    console.log("Inputs:", selectedUtxos);
    console.log("Outputs:", vouts);
    console.log("Change:", change);
    console.log("Fee:", estimatedFee);

    return {
      psbtHex,
      fee: estimatedFee,
      change,
      inputsToSign: selectedUtxos.map((_, index) => ({ index })),
    };
  } catch (error) {
    console.error("Error in prepareSrc20TX:", error);
    throw error;
  }
};

function isValidPubkey(pubkey: string): boolean {
  try {
    const pubkeyBuffer = Buffer.from(pubkey, "hex");
    return ecc.isPoint(pubkeyBuffer);
  } catch {
    return false;
  }
}
