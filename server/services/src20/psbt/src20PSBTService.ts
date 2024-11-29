import * as bitcoin from "bitcoinjs-lib";
const { networks, address, Psbt, payments } = bitcoin;
import { UTXO } from "$types/index.d.ts";
import { PSBTInput } from "$types/index.d.ts";
import CIP33 from "$lib/utils/minting/olga/CIP33.ts";
import {
  calculateDust,
  calculateMiningFee,
} from "$lib/utils/minting/feeCalculations.ts";
import { estimateTransactionSize } from "$lib/utils/minting/transactionSizes.ts";
import * as msgpack from "msgpack";
import { TransactionService } from "$server/services/transaction/index.ts";
import { hex2bin } from "$lib/utils/binary/baseUtils.ts";
import { SRC20Service } from "$server/services/src20/index.ts";
import { UTXOService } from "$server/services/transaction/utxoService.ts";
import { getScriptTypeInfo } from "$lib/utils/scriptTypeUtils.ts";
import { TX_CONSTANTS } from "$lib/utils/minting/constants.ts";
import { logger } from "$lib/utils/logger.ts";
import { QuicknodeService } from "$server/services/quicknode/quicknodeService.ts";

export class SRC20PSBTService {
  private static readonly DUST_SIZE = 420; // Min is 330
  private static readonly STAMP_PREFIX = "stamp:";

  static async preparePSBT({
    sourceAddress,
    toAddress,
    src20Action,
    satsPerVB,
    service_fee,
    service_fee_address,
    changeAddress,
    dryRun = false,
    trxType = "olga",
  }: {
    sourceAddress: string;
    toAddress: string;
    src20Action: string | object;
    satsPerVB: number;
    service_fee: number;
    service_fee_address: string;
    changeAddress: string;
    dryRun?: boolean;
    trxType?: "olga" | "multisig";
  }) {
    const effectiveChangeAddress = changeAddress || sourceAddress;
    const network = networks.bitcoin;
    let psbt: Psbt | undefined;
    const vouts = [];

    // Prepare action data and CIP33 addresses
    const { actionData, finalData, hex_data } = await this.prepareActionData(src20Action);
    const expectedOutputs = this.calculateExpectedOutputs(hex_data);
    
    logger.debug("stamps", {
      message: "Action data prepared",
      data: {
        actionDataLength: actionData.length,
        finalDataLength: finalData.length,
        hex_dataLength: hex_data.length,
        expectedCIP33Outputs: expectedOutputs,
        hex_data: hex_data.substring(0, 100) + "..."
      }
    });

    const cip33Addresses = await this.generateCIP33Addresses(hex_data);

    // Verify we got the expected number of addresses
    if (cip33Addresses.length !== expectedOutputs.numOutputs) {
      logger.warn("stamps", {
        message: "CIP33 address count mismatch",
        data: {
          expected: expectedOutputs.numOutputs,
          actual: cip33Addresses.length,
          hex_dataLength: hex_data.length
        }
      });
    }

    logger.debug("stamps", {
      message: "Generated CIP33 addresses",
      data: {
        addressCount: cip33Addresses.length,
        addresses: cip33Addresses,
        hex_dataLength: hex_data.length,
        expectedOutputs: cip33Addresses.length + 2 // +1 for real pubkey, +1 for change
      }
    });

    // Add the first output (toAddress) as a real pubkey output
    const toAddressScript = address.toOutputScript(toAddress, network);
    vouts.push({
      script: toAddressScript,
      value: this.DUST_SIZE,
      isReal: true // Flag to identify real pubkey outputs
    });

    logger.debug("stamps", {
      message: "Added real pubkey output",
      data: {
        address: toAddress,
        value: this.DUST_SIZE,
        scriptType: "real_pubkey"
      }
    });

    // Add CIP33 fake pubkey outputs
    for (let i = 0; i < cip33Addresses.length; i++) {
      const dustValue = this.DUST_SIZE + i;
      vouts.push(this.createAddressOutput(cip33Addresses[i], dustValue));
    }

    // Add service fee output if applicable (as real pubkey)
    if (service_fee > 0 && service_fee_address) {
      const serviceFeeScript = address.toOutputScript(service_fee_address, network);
      vouts.push({
        script: serviceFeeScript,
        value: service_fee,
        isReal: true
      });
    }

    logger.debug("stamps", {
      message: "Initial outputs prepared",
      outputCount: vouts.length,
      outputs: vouts.map(v => ({
        value: v.value,
        isReal: v.isReal || false,
        script: v.script ? 
          (v.script instanceof Uint8Array ? 
            Array.from(v.script)
              .map(b => b.toString(16).padStart(2, '0'))
              .join('') 
            : Array.from(new Uint8Array(v.script))
              .map(b => b.toString(16).padStart(2, '0'))
              .join(''))
          : v.address // Fallback to address if script is undefined
      }))
    });

    // Select UTXOs and calculate fees
    const { inputs, change, fee } = await TransactionService.UTXOService.selectUTXOsForTransaction(
      sourceAddress,
      vouts,
      satsPerVB,
      0,
      1.5,
      { filterStampUTXOs: true, includeAncestors: true }
    );

    logger.debug("stamps", {
      message: "UTXO selection completed",
      inputCount: inputs.length,
      change,
      fee
    });

    // Calculate estimated size based on transaction type
    const estimatedTxSize = estimateTransactionSize({
      inputs: inputs.map(input => ({
        type: getScriptTypeInfo(input.script).type,
        size: input.size,
        isWitness: this.isWitnessInput(input.script),
        ancestor: input.ancestor
      })),
      outputs: [
        // Real pubkey output (first output)
        {
          type: trxType === "olga" ? "P2WPKH" : "P2SH",
          size: TX_CONSTANTS[trxType === "olga" ? "P2WPKH" : "P2SH"].size,
          isWitness: trxType === "olga",
          value: this.DUST_SIZE
        },
        // CIP33 outputs - use actual CIP33 address count
        ...cip33Addresses.map((_, index) => ({
          type: trxType === "olga" ? "P2WSH" : "P2SH",
          size: TX_CONSTANTS[trxType === "olga" ? "P2WSH" : "P2SH"].size,
          isWitness: trxType === "olga",
          value: this.DUST_SIZE + index
        }))
      ],
      includeChangeOutput: change > this.DUST_SIZE,
      changeOutputType: trxType === "olga" ? "P2WPKH" : "P2SH",
      isMultisig: trxType === "multisig"
    });

    const estMinerFee = calculateMiningFee(
      inputs.map(input => ({
        type: getScriptTypeInfo(input.script).type,
        size: input.size,
        isWitness: this.isWitnessInput(input.script),
        ancestor: input.ancestor
      })),
      [
        // Real pubkey output
        {
          type: trxType === "olga" ? "P2WPKH" : "P2SH",
          size: TX_CONSTANTS[trxType === "olga" ? "P2WPKH" : "P2SH"].size,
          isWitness: trxType === "olga",
          value: this.DUST_SIZE
        },
        ...cip33Addresses.map((_, index) => ({
          type: trxType === "olga" ? "P2WSH" : "P2SH",
          size: TX_CONSTANTS[trxType === "olga" ? "P2WSH" : "P2SH"].size,
          isWitness: trxType === "olga",
          value: this.DUST_SIZE + index
        })),
        ...(change > this.DUST_SIZE ? [{
          type: trxType === "olga" ? "P2WPKH" : "P2SH",
          size: TX_CONSTANTS[trxType === "olga" ? "P2WPKH" : "P2SH"].size,
          isWitness: trxType === "olga",
          value: change
        }] : [])
      ],
      satsPerVB,
      {
        includeChangeOutput: change > this.DUST_SIZE,
        changeOutputType: trxType === "olga" ? "P2WPKH" : "P2SH",
        isMultisig: trxType === "multisig"
      }
    );

    // Add debug logging for fee calculation
    logger.debug("stamps", {
      message: "Fee calculation details",
      data: {
        inputs: inputs.map(input => ({
          type: getScriptTypeInfo(input.script).type,
          isWitness: this.isWitnessInput(input.script),
          size: input.size
        })),
        outputs: vouts.map(vout => ({
          isReal: vout.isReal,
          type: vout.isReal ? 
            (trxType === "olga" ? "P2WPKH" : "P2SH") : 
            (trxType === "olga" ? "P2WSH" : "P2SH"),
          value: vout.value
        })),
        estimatedTxSize,
        estMinerFee,
        satsPerVB,
        trxType,
        changeIncluded: change > this.DUST_SIZE
      }
    });

    // If dryRun, return fee estimation without creating PSBT
    if (dryRun) {
      return {
        estimatedTxSize,
        totalInputValue: inputs.reduce((sum, input) => sum + Number(input.value), 0),
        totalOutputValue: vouts.reduce((sum, vout) => sum + Number(vout.value), 0),
        totalChangeOutput: change,
        totalDustValue: vouts.reduce((sum, vout) => 
          Number(vout.value) <= this.DUST_SIZE ? sum + Number(vout.value) : sum, 0),
        estMinerFee,
        outputCount: vouts.length,
      };
    }

    // Create PSBT only if not dryRun
    psbt = new Psbt({ network });

    // Add inputs to PSBT
    for (const input of inputs) {
      const txDetails = await QuicknodeService.getTransaction(input.txid);
      if (!txDetails) {
        throw new Error(`Failed to fetch transaction details for ${input.txid}`);
      }

      logger.debug("stamps", {
        message: "Creating PSBT input",
        data: {
          txid: input.txid,
          vout: input.vout,
          value: Number(input.value),
          address: input.address,
          script: input.script,
        }
      });

      const psbtInput: PSBTInput = {
        hash: input.txid,
        index: input.vout,
        sequence: 0xfffffffd, // Enable RBF
      };

      // Always include nonWitnessUtxo
      psbtInput.nonWitnessUtxo = new Uint8Array(hex2bin(txDetails.hex));

      // Add witnessUtxo for witness inputs
      if (this.isWitnessInput(input.script)) {
        psbtInput.witnessUtxo = {
          script: new Uint8Array(hex2bin(input.script)),
          value: BigInt(input.value), // Ensure value is BigInt
        };

        logger.debug("stamps", {
          message: "Adding witness UTXO",
          data: {
            script: Array.from(new Uint8Array(hex2bin(input.script)))
              .map(b => b.toString(16).padStart(2, '0'))
              .join(''),
            value: input.value,
            valueAsBigInt: BigInt(input.value).toString()
          }
        });
      }

      psbt.addInput(psbtInput);
    }

    // Add outputs to PSBT with appropriate handling
    for (const vout of vouts) {
      let outputScript: Uint8Array;
      try {
        if (vout.isReal && vout.script) {
          // For real pubkey outputs, use the script directly
          outputScript = vout.script instanceof Uint8Array ? 
            vout.script : 
            new Uint8Array(vout.script);
        } else if (vout.address) {
          // For CIP33 fake pubkey outputs, use the address-based script
          const script = address.toOutputScript(vout.address, network);
          outputScript = script instanceof Uint8Array ? script : new Uint8Array(script);
        } else {
          throw new Error("Output must have either script or address");
        }

        logger.debug("stamps", {
          message: "Adding PSBT output",
          data: {
            isReal: vout.isReal,
            value: vout.value,
            scriptLength: outputScript.length,
            scriptHex: Array.from(outputScript)
              .map(b => b.toString(16).padStart(2, '0'))
              .join('')
          }
        });

        psbt.addOutput({
          script: outputScript,
          value: BigInt(vout.value), // Convert to BigInt for consistency
        });
      } catch (error) {
        logger.error("stamps", {
          message: "Error adding output to PSBT",
          error: error instanceof Error ? error.message : String(error),
          output: {
            isReal: vout.isReal,
            hasScript: !!vout.script,
            hasAddress: !!vout.address,
            value: vout.value
          }
        });
        throw error;
      }
    }

    // Update change output handling
    if (change > this.DUST_SIZE) {
      try {
        const changeScript = address.toOutputScript(effectiveChangeAddress, network);
        const changeOutputScript = changeScript instanceof Uint8Array ? 
          changeScript : 
          new Uint8Array(changeScript);

        logger.debug("stamps", {
          message: "Adding change output",
          data: {
            address: effectiveChangeAddress,
            value: change,
            scriptLength: changeOutputScript.length,
            scriptHex: Array.from(changeOutputScript)
              .map(b => b.toString(16).padStart(2, '0'))
              .join('')
          }
        });

        psbt.addOutput({
          script: changeOutputScript,
          value: BigInt(change), // Convert to BigInt for consistency
        });
      } catch (error) {
        logger.error("stamps", {
          message: "Error adding change output to PSBT",
          error: error instanceof Error ? error.message : String(error),
          changeAddress: effectiveChangeAddress,
          changeAmount: change
        });
        throw error;
      }
    }

    logger.debug("stamps", {
      message: "Final PSBT data prepared",
      data: {
        hex: psbt.toHex(),
        base64: psbt.toBase64(),
        estimatedTxSize: estimatedTxSize,
        totalInputValue: inputs.reduce((sum, input) => 
          sum + Number(input.value), 0),
        totalOutputValue: vouts.reduce((sum, vout) => 
          sum + Number(vout.value), 0),
        totalChangeOutput: change,
        totalDustValue: vouts.reduce((sum, vout) => 
          Number(vout.value) <= this.DUST_SIZE ? 
            sum + Number(vout.value) : sum, 0),
        estMinerFee,
        outputScripts: vouts.map(v => ({
          value: v.value,
          isReal: v.isReal || false,
          script: v.script ? 
            (v.script instanceof Uint8Array ? 
              Array.from(v.script)
                .map(b => b.toString(16).padStart(2, '0'))
                .join('') 
              : Array.from(new Uint8Array(v.script))
                .map(b => b.toString(16).padStart(2, '0'))
                .join(''))
            : v.address, // Fallback to address if script is undefined
          address: v.address // Include address for reference
        }))
      }
    });

    return {
      psbt,
      estimatedTxSize,
      totalInputValue: inputs.reduce((sum, input) => sum + Number(input.value), 0),
      totalOutputValue: vouts.reduce((sum, vout) => sum + Number(vout.value), 0),
      totalChangeOutput: change,
      totalDustValue: vouts.reduce((sum, vout) => 
        Number(vout.value) <= this.DUST_SIZE ? sum + Number(vout.value) : sum, 0),
      estMinerFee,
      changeAddress: effectiveChangeAddress,
    };
  }

  private static async prepareActionData(src20Action: string | object) {
    let actionData: Uint8Array;
    const stampPrefixBytes = new TextEncoder().encode(this.STAMP_PREFIX);

    logger.debug("stamps", {
      message: "Preparing action data",
      data: {
        inputType: typeof src20Action,
        stampPrefix: this.STAMP_PREFIX,
      }
    });

    try {
      const parsedAction = typeof src20Action === "string"
        ? JSON.parse(src20Action)
        : src20Action;

      const msgpackData = msgpack.encode(parsedAction);
      const { compressedData, compressed } = await SRC20Service.CompressionService.compressWithCheck(msgpackData);
      actionData = compressed ? compressedData : msgpackData;

      logger.debug("stamps", {
        message: "Action data encoded",
        data: {
          wasCompressed: compressed,
          originalLength: msgpackData.length,
          finalLength: actionData.length
        }
      });
    } catch (error) {
      logger.warn("stamps", {
        message: "Failed to encode/compress action data, falling back to JSON string",
        error: error instanceof Error ? error.message : String(error)
      });
      const actionString = JSON.stringify(src20Action);
      actionData = new TextEncoder().encode(actionString);
    }

    const fullData = new Uint8Array([...stampPrefixBytes, ...actionData]);
    const dataLength = fullData.length;
    const lengthPrefix = new Uint8Array(2);
    new DataView(lengthPrefix.buffer).setUint16(0, dataLength, false);
    const finalData = new Uint8Array([...lengthPrefix, ...fullData]);
    
    const hex_data = Array.from(finalData)
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');

    logger.debug("stamps", {
      message: "Final action data prepared",
      data: {
        prefixLength: stampPrefixBytes.length,
        actionDataLength: actionData.length,
        fullDataLength: fullData.length,
        finalDataLength: finalData.length,
        hex_dataLength: hex_data.length,
        lengthPrefix: Array.from(lengthPrefix).map(b => b.toString(16).padStart(2, '0')).join('')
      }
    });

    return { 
      actionData,   // The original action data
      finalData,    // The complete data with prefix and length
      hex_data      // The hex string representation
    };
  }

  private static createAddressOutput(
    address: string, 
    value: number
  ): { address: string; value: number; isReal?: boolean } {
    if (!address) {
      throw new Error("Invalid address: address is undefined");
    }
    return { 
      address, 
      value,
      isReal: false // Mark as fake pubkey output
    };
  }

  private static getInputType(inputDetails: any): string {
    if (!inputDetails?.scriptPubKey?.type) {
      throw new Error("Invalid input details: missing scriptPubKey or type");
    }

    const scriptType = inputDetails.scriptPubKey.type;
    switch (scriptType) {
      case "pubkeyhash":
        return "p2pkh";
      case "scripthash":
        return "p2sh";
      case "witness_v0_keyhash":
        return "p2wpkh";
      case "witness_v0_scripthash":
        return "p2wsh";
      default:
        console.warn(`Unknown script type: ${scriptType}`);
        return "unknown";
    }
  }

  private static createPsbtInput(input: UTXO, txDetails: any): PSBTInput {
    logger.debug("stamps", {
      message: "Creating PSBT input",
      data: {
        txid: input.txid,
        vout: input.vout,
        value: Number(input.value),
        address: input.address,
        script: input.script,
      }
    });

    const inputDetails = txDetails.vout[input.vout];
    if (!inputDetails) {
      throw new Error(`Invalid input: no details found for vout ${input.vout}`);
    }

    const psbtInput: PSBTInput = {
      hash: input.txid,
      index: input.vout,
      sequence: 0xfffffffd, // Enable RBF
    };

    const scriptType = getScriptTypeInfo(input.script);
    
    if (scriptType.isWitness) {
      psbtInput.witnessUtxo = {
        script: new Uint8Array(hex2bin(inputDetails.scriptPubKey.hex)),
        value: BigInt(input.value),
      };
    } else {
      psbtInput.nonWitnessUtxo = new Uint8Array(hex2bin(txDetails.hex));
    }

    return psbtInput;
  }

  private static createOutputMatchingInputType(
    address: string,
    inputType: string,
    network: bitcoin.Network,
  ) {
    const payment = (() => {
      switch (inputType) {
        case "p2pkh":
          return payments.p2pkh({ address, network });
        case "p2sh":
          return payments.p2sh({ address, network });
        case "p2wpkh":
          return payments.p2wpkh({ address, network });
        case "p2wsh":
          return payments.p2wsh({ address, network });
        default:
          // Default to P2WPKH if input type is unknown
          return payments.p2wpkh({ address, network });
      }
    })();

    if (!payment.output) {
      throw new Error(`Failed to create output script for ${inputType}`);
    }

    return {
      output: new Uint8Array(payment.output),
      network
    };
  }

  private static createP2WSHOutput(
    address: string,
    value: number,
    network: bitcoin.Network,
  ): { script: Uint8Array; value: number } {
    if (!address) {
      throw new Error("Invalid address: address is undefined");
    }

    try {
      const script = address.toOutputScript(address, network);
      const p2wshOutput = payments.p2wsh({ 
        redeem: { 
          output: script instanceof Uint8Array ? script : new Uint8Array(script),
          network 
        },
        network 
      });

      if (!p2wshOutput.output) {
        throw new Error("Failed to create P2WSH output");
      }

      return {
        script: p2wshOutput.output instanceof Uint8Array ? 
          p2wshOutput.output : 
          new Uint8Array(p2wshOutput.output),
        value,
      };
    } catch (error) {
      console.error(`Error creating P2WSH output for address ${address}:`, error);
      throw error;
    }
  }

  private static async generateCIP33Addresses(hex_data: string) {
    const cip33Addresses = CIP33.file_to_addresses(hex_data);
    if (!cip33Addresses || cip33Addresses.length === 0) {
      throw new Error("Failed to generate CIP33 addresses");
    }
    return cip33Addresses;
  }

  private static isWitnessInput(script: string): boolean {
    const scriptType = getScriptTypeInfo(script);
    return scriptType.isWitness;
  }

  // Add a method to calculate expected CIP33 outputs
  private static calculateExpectedOutputs(hex_data: string) {
    // Each P2WSH output can hold ~520 bytes of data
    const BYTES_PER_OUTPUT = 520;
    const totalBytes = hex_data.length / 2; // Convert hex length to bytes
    const numCIP33Outputs = Math.ceil(totalBytes / BYTES_PER_OUTPUT);

    // Log the calculation for debugging
    logger.debug("stamps", {
      message: "Calculating expected outputs",
      data: {
        totalBytes,
        bytesPerOutput: BYTES_PER_OUTPUT,
        numCIP33Outputs,
        hex_dataLength: hex_data.length,
      }
    });

    return {
      numOutputs: numCIP33Outputs,
      totalBytes,
      bytesPerOutput: BYTES_PER_OUTPUT,
      expectedTotalOutputs: numCIP33Outputs + 2 // +1 for real pubkey, +1 for change
    };
  }

  private static calculateRequiredOutputs(actionData: object) {
    const jsonString = JSON.stringify(actionData);
    const BYTES_PER_OUTPUT = 520;
    return Math.ceil(jsonString.length / BYTES_PER_OUTPUT);
  }

  static async estimateFees({
    sourceAddress,
    actionData,
    satsPerVB,
    cachedUTXOs = null, // Allow passing cached UTXOs
  }) {
    const requiredOutputs = this.calculateRequiredOutputs(actionData);
    
    // Basic size estimation without fetching UTXOs
    const baseSize = 41; // version + locktime + input count + output count
    const inputSize = 68; // P2WPKH input
    const witnessSize = 107; // P2WPKH witness
    const p2wshOutputSize = 43; // P2WSH output size
    
    // 1 real output + CIP33 outputs + change
    const totalOutputs = 1 + requiredOutputs + 1;
    
    const estimatedSize = baseSize + 
      inputSize + 
      (witnessSize / 4) + 
      (totalOutputs * p2wshOutputSize);

    // Calculate dust outputs (all outputs except change)
    const dustOutputs = totalOutputs - 1;
    const dustValue = dustOutputs * 420;

    // Estimate miner fee
    const minerFee = Math.ceil(estimatedSize * satsPerVB);

    return {
      estimatedSize,
      minerFee,
      dustValue,
      requiredOutputs,
    };
  }
}

function toOutputScript(address: string): Buffer {
  try {
    // First try standard address to script conversion
    return address.toOutputScript(networks.bitcoin);
  } catch (e) {
    // If that fails, handle P2WSH addresses manually
    if (address.startsWith('bc1q') && address.length === 62) {
      const decoded = address.fromBech32(address);
      return payments.p2wsh({
        hash: decoded.data,
        network: networks.bitcoin
      }).output!;
    }
    throw e;
  }
}
