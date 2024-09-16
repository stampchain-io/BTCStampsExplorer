import * as bitcoin from "bitcoinjs-lib";
import * as ecc from "tiny-secp256k1";
import * as crypto from "crypto";
import { Buffer } from "buffer";
import { selectUTXOs } from "./utxo-selector.ts";
import { bin2hex, hex2bin, scramble } from "../utils.ts";
import { compressWithCheck } from "../zlib.ts";
import { serverConfig } from "$server/config/config.ts";
import { IPrepareSRC20TX, PSBTInput, UTXO, VOUT } from "$lib/types/src20.d.ts";
import { getTransaction } from "../../quicknode.ts";
import { getUTXOForAddress } from "utils/minting/src20/utils.ts";

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

    // Compress and encrypt the transfer string
    let transferHex = await compressWithCheck(`stamp:${transferString}`);
    console.log("Compressed transferHex", transferHex);

    // Pad the transfer hex
    const count = (transferHex.length / 2).toString(16).padStart(4, "0");
    transferHex = count + transferHex;
    const remaining = transferHex.length % (62 * 2);
    if (remaining > 0) {
      transferHex = transferHex.padEnd(
        transferHex.length + (62 * 2 - remaining),
        "0",
      );
    }
    console.log("Padded transferHex", transferHex);

    // ARC4 encode using the first UTXO's txid as the key
    const encryption = bin2hex(
      scramble(hex2bin(utxos[0].txid), hex2bin(transferHex)),
    );
    console.log("Encrypted data", encryption);

    // Create chunks and multisig scripts
    const chunks = encryption.match(/.{1,124}/g) || [];
    const multisigScripts = chunks.map((chunk) => {
      const pubkey_seg1 = chunk.substring(0, 62);
      const pubkey_seg2 = chunk.substring(62, 124);
      let pubkey1, pubkey2;

      do {
        const first_byte = Math.random() > 0.5 ? "02" : "03";
        const second_byte = crypto.randomBytes(1).toString("hex");
        pubkey1 = first_byte + pubkey_seg1 + second_byte;
      } while (!isValidPubkey(pubkey1));

      do {
        const first_byte = Math.random() > 0.5 ? "02" : "03";
        const second_byte = crypto.randomBytes(1).toString("hex");
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
    if (parseInt(serverConfig.MINTING_SERVICE_FEE_ENABLED || "0") === 1) {
      const feeAddress = serverConfig.MINTING_SERVICE_FEE_ADDRESS || "";
      const feeAmount = parseInt(
        serverConfig.MINTING_SERVICE_FEE_FIXED_SATS || "0",
      );
      vouts.push({ address: feeAddress, value: feeAmount });
    }

    // Select UTXOs
    const { inputs: selectedUtxos, change, fee: estimatedFee } = selectUTXOs(
      utxos,
      vouts,
      feeRate,
    );

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
