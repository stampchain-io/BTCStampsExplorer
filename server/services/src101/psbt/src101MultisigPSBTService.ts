// was previously // lib/utils/minting/src20/tx.ts

import * as bitcoin from "bitcoinjs-lib";
// Conditionally import tiny-secp256k1 only if we're not in build mode
let ecc: any = null;
if (!Deno.args.includes("build")) {
  // Only import in runtime mode
  try {
    ecc = await import("tiny-secp256k1");
    console.log("Successfully loaded tiny-secp256k1");
    bitcoin.initEccLib(ecc);
  } catch (e) {
    console.error("Failed to load tiny-secp256k1:", e);
    // Provide stub implementation for ecc
    ecc = {
      privateKeyVerify: () => true,
      publicKeyCreate: () => new Uint8Array(33),
      publicKeyVerify: () => true,
      ecdsaSign: () => ({ signature: new Uint8Array(64), recid: 0 }),
      ecdsaVerify: () => true,
      ecdsaRecover: () => new Uint8Array(65),
      isPoint: () => true
    };
  }
} else {
  // In build mode, provide stub implementation
  console.log("[BUILD] Using stub implementation for tiny-secp256k1");
  ecc = {
    privateKeyVerify: () => true,
    publicKeyCreate: () => new Uint8Array(33),
    publicKeyVerify: () => true,
    ecdsaSign: () => ({ signature: new Uint8Array(64), recid: 0 }),
    ecdsaVerify: () => true,
    ecdsaRecover: () => new Uint8Array(65),
    isPoint: () => true
  };
}

import { crypto } from "@std/crypto";
import { TransactionService } from "$server/services/transaction/index.ts";
import { arc4 } from "$lib/utils/minting/transactionUtils.ts";
import { bin2hex, hex2bin } from "$lib/utils/binary/baseUtils.ts";
import { SRC101Service } from "$server/services/src101/index.ts";
import { serverConfig } from "$server/config/config.ts";
import { IPrepareSRC101TX, PSBTInput, VOUT } from "$types/index.d.ts";
import * as msgpack from "msgpack";
import { estimateTransactionSize } from "$lib/utils/minting/transactionSizes.ts";
import { QuicknodeService } from "$server/services/quicknode/quicknodeService.ts";

export class SRC101MultisigPSBTService {
  private static readonly RECIPIENT_DUST = 789;
  private static readonly MULTISIG_DUST = 809;
  private static readonly CHANGE_DUST = 1000;
  private static readonly THIRD_PUBKEY = "020202020202020202020202020202020202020202020202020202020202020202";

  static async preparePSBT({
    network,
    sourceAddress,
    changeAddress,
    recAddress,
    recVault,
    feeRate,
    transferString,
    enableRBF = true,
  }: IPrepareSRC101TX) {
    try {
      console.log("Starting prepareSr101TX");
      const psbtNetwork = network === "testnet"
        ? bitcoin.networks.testnet
        : bitcoin.networks.bitcoin;
      console.log("Using network:", psbtNetwork);
      console.log("Using sourceAddress:", sourceAddress);
      console.log("Using changeAddress:", changeAddress);
      console.log("Using recAddress:", recAddress);
      console.log("Using recVault:", recVault);
      console.log("Using feeRate:", feeRate);
      console.log("Using transferString:", transferString);

      const psbt = new bitcoin.Psbt({ network: psbtNetwork });

      // Prepare initial vouts with recipient output
      const vouts: VOUT[] = [
        { address: recAddress || changeAddress, value: recVault || this.RECIPIENT_DUST },
      ];

      // Select UTXOs first to get txid for encryption
      const { inputs, change, fee } = await TransactionService.UTXOService.selectUTXOsForTransaction(
        sourceAddress,
        vouts,
        feeRate,
        0,
        1.5,
        { filterStampUTXOs: true, includeAncestors: true }
      );

      if (inputs.length === 0) {
        throw new Error("Unable to select suitable UTXOs for the transaction");
      }

      // Prepare and encrypt data using first input's txid
      let transferDataBytes: Uint8Array;
      const stampPrefixBytes = new TextEncoder().encode("stamp:");

      const transferData = JSON.parse(transferString);
      console.log("transferData:", transferData)

      transferDataBytes = new TextEncoder().encode(JSON.stringify(transferData));
      console.log("transferDataBytes:", bin2hex(transferDataBytes))

      // Add stamp prefix and length prefix
      const dataWithPrefix = new Uint8Array([...stampPrefixBytes, ...transferDataBytes]);
      let dataLength = dataWithPrefix.length;
      while (dataLength > 0 && dataWithPrefix[dataLength - 1] === 0) dataLength--;

      const lengthPrefix = new Uint8Array([(dataLength >> 8) & 0xff, dataLength & 0xff]);
      let payloadBytes = new Uint8Array([...lengthPrefix, ...dataWithPrefix]);
      // Pad data
      const padLength = (62 - (payloadBytes.length % 62)) % 62;
      if (padLength > 0) {
        payloadBytes = new Uint8Array([...payloadBytes, ...new Uint8Array(padLength)]);
      }

      // Encrypt data using first input's txid
      const txidBytes = hex2bin(inputs[0].txid);
      const encryptedDataBytes = arc4(txidBytes, payloadBytes);

      // Create multisig outputs
      const chunks: Uint8Array[] = [];
      for (let i = 0; i < encryptedDataBytes.length; i += 62) {
        chunks.push(encryptedDataBytes.slice(i, i + 62));
      }

      // Add multisig outputs
      for (const chunk of chunks) {
        const pubkey_seg1 = bin2hex(chunk.slice(0, 31));
        const pubkey_seg2 = bin2hex(chunk.slice(31, 62));
        let pubkey1: string, pubkey2: string;

        do {
          const randomBytes = new Uint8Array(1);
          crypto.getRandomValues(randomBytes);
          const first_byte = randomBytes[0] & 1 ? "02" : "03";
          const second_byte = randomBytes[0].toString(16).padStart(2, "0");
          pubkey1 = first_byte + pubkey_seg1 + second_byte;
        } while (!this.isValidPubkey(pubkey1));

        do {
          const randomBytes = new Uint8Array(1);
          crypto.getRandomValues(randomBytes);
          const first_byte = randomBytes[0] & 1 ? "02" : "03";
          const second_byte = randomBytes[0].toString(16).padStart(2, "0");
          pubkey2 = first_byte + pubkey_seg2 + second_byte;
        } while (!this.isValidPubkey(pubkey2));

        const script = `5121${pubkey1}21${pubkey2}21${this.THIRD_PUBKEY}53ae`;
        vouts.push({
          script: hex2bin(script),
          value: this.MULTISIG_DUST,
        });
      }

      // Add service fee if enabled
      if (parseInt(serverConfig.MINTING_SERVICE_FEE_ENABLED || "0", 10) === 1) {
        const feeAddress = serverConfig.MINTING_SERVICE_FEE_ADDRESS || "";
        const feeAmount = parseInt(serverConfig.MINTING_SERVICE_FEE_FIXED_SATS || "0", 10);
        vouts.push({ address: feeAddress, value: feeAmount });
      }

      // Add inputs to PSBT
      for (const input of inputs) {
        const txDetails = await QuicknodeService.getTransaction(input.txid);
        if (!txDetails?.vout) throw new Error(`Transaction details not found for txid: ${input.txid}`);

        const inputDetails = txDetails.vout[input.vout];
        if (!inputDetails) throw new Error(`No vout found at index ${input.vout} for transaction ${input.txid}`);

        const isWitnessUtxo = inputDetails.scriptPubKey?.type?.startsWith("witness");
        if (typeof isWitnessUtxo === "undefined") {
          throw new Error(`scriptPubKey.type is undefined for txid: ${input.txid}, vout: ${input.vout}`);
        }

        const psbtInput: PSBTInput = {
          hash: input.txid,
          index: input.vout,
          sequence: enableRBF ? 0xfffffffd : 0xffffffff,
        };

        if (isWitnessUtxo) {
          psbtInput.witnessUtxo = {
            script: hex2bin(inputDetails.scriptPubKey.hex),
            value: BigInt(input.value),
          };
        } else {
          psbtInput.nonWitnessUtxo = hex2bin(txDetails.hex);
        }

        psbt.addInput(psbtInput);
      }

      // Calculate total input and output values
      const totalInputValue = inputs.reduce((sum, input) => 
        BigInt(sum) + BigInt(input.value), BigInt(0));

      // Calculate total output value before change
      const outputsBeforeChange = vouts.reduce((sum, vout) => 
        BigInt(sum) + BigInt(vout.value), BigInt(0));

      // Calculate fee
      const estimatedFee = BigInt(fee);

      // Calculate change correctly
      const changeAmount = totalInputValue - outputsBeforeChange - estimatedFee;

      // Add all outputs to PSBT
      vouts.forEach((vout) => {
        if ("address" in vout && vout.address) {
          psbt.addOutput({ 
            address: vout.address, 
            value: BigInt(vout.value) 
          });
        } else if ("script" in vout && vout.script) {
          psbt.addOutput({ 
            script: new Uint8Array(vout.script), 
            value: BigInt(vout.value) 
          });
        }
      });

      // Add change output if it's above dust
      if (changeAmount > this.CHANGE_DUST) {
        psbt.addOutput({ 
          address: changeAddress, 
          value: changeAmount 
        });
      }

      // Convert values to strings for logging
      console.log("Final transaction details:", {
        inputs: inputs.map(utxo => ({
          ...utxo,
          value: BigInt(utxo.value).toString()
        })),
        outputs: vouts.map(vout => ({
          ...vout,
          value: BigInt(vout.value).toString()
        })),
        change: changeAmount.toString(),
        fee: BigInt(fee).toString()
      });

      return {
        psbtHex: psbt.toHex(),
        psbtBase64: psbt.toBase64(),
        fee: fee.toString(),
        change: changeAmount.toString(),
        inputsToSign: inputs.map((_, index) => ({ index })),
        estimatedTxSize: estimateTransactionSize({
          inputs,
          outputs: vouts,
          includeChangeOutput: true,
          changeOutputType: "P2WPKH"
        }),
      };
    } catch (error) {
      console.error("Error in prepareSrc101TX:", error);
      throw error;
    }
  }

  private static isValidPubkey(pubkey: string): boolean {
    try {
      const pubkeyBytes = hex2bin(pubkey);
      return ecc.isPoint(pubkeyBytes);
    } catch {
      return false;
    }
  }
}
