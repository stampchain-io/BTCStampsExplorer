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

interface PSBTParams {
  sourceAddress: string;
  toAddress: string;
  src20Action: Record<string, unknown>;
  satsPerVB: number;
  service_fee: number;
  service_fee_address: string;
  changeAddress: string;
  utxoAncestors?: AncestorInfo[];
  dryRun?: boolean;
  trxType?: "olga" | "multisig";
  utxos?: Array<{
    txid: string;
    vout: number;
    value: number;
    script: string;
    address: string;
  }>;
}

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
    utxoAncestors = [],
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
    utxoAncestors?: Array<{
      txid: string;
      vout: number;
      weight?: number;
    }>;
    dryRun?: boolean;
    trxType?: "olga" | "multisig";
  }) {
    const effectiveChangeAddress = changeAddress || sourceAddress;
    const network = networks.bitcoin;
    let psbt: Psbt | undefined;
    const vouts = [];

    // Prepare action data and CIP33 addresses
    const { actionData, finalData, hex_data, chunks } = await this.prepareActionData(src20Action);

    // Add the first output (toAddress) as a real pubkey output
    const toAddressScript = address.toOutputScript(toAddress, network);
    vouts.push({
      script: toAddressScript,
      value: this.DUST_SIZE,
      isReal: true
    });

    // Add data outputs
    for (let i = 0; i < chunks.length; i++) {
      // Get CIP33 address for this chunk
      const cip33Address = CIP33.file_to_addresses(hex_data)[i];
      if (!cip33Address) {
        throw new Error(`Failed to generate CIP33 address for chunk ${i}`);
      }

      // Create output script from address
      const outputScript = address.toOutputScript(cip33Address, network);

      vouts.push({
        script: outputScript,
        value: this.DUST_SIZE + i,
        isReal: false,
        address: cip33Address // Keep address for reference
      });

      logger.debug("stamps", {
        message: "Created CIP33 output",
        data: {
          chunkIndex: i,
          address: cip33Address,
          scriptHex: Array.from(outputScript)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')
        }
      });
    }

    // Add service fee output if applicable
    if (service_fee > 0 && service_fee_address) {
      const serviceFeeScript = address.toOutputScript(service_fee_address, network);
      vouts.push({
        script: serviceFeeScript,
        value: service_fee,
        isReal: true
      });
    }

    // Log outputs for debugging
    logger.debug("stamps", {
      message: "Prepared outputs",
      data: {
        outputCount: vouts.length,
        outputs: vouts.map(v => ({
          value: v.value,
          isReal: v.isReal,
          scriptHex: Array.from(v.script)
            .map(b => b.toString(16).padStart(2, '0'))
            .join('')
        }))
      }
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
        ...chunks.map((_, index) => ({
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

    const { fee: estMinerFee, vsize: txVsize } = this.calculateTotalFee(
      inputs.map(input => ({
        type: getScriptTypeInfo(input.script).type,
        size: input.size,
        isWitness: this.isWitnessInput(input.script),
        ancestor: utxoAncestors.find(a => a.txid === input.txid && a.vout === input.vout)
      })),
      [
        // Real pubkey output
        {
          type: trxType === "olga" ? "P2WPKH" : "P2SH",
          size: TX_CONSTANTS[trxType === "olga" ? "P2WPKH" : "P2SH"].size,
          isWitness: trxType === "olga",
          value: this.DUST_SIZE
        },
        ...chunks.map((_, index) => ({
          type: trxType === "olga" ? "P2WSH" : "P2SH",
          size: TX_CONSTANTS[trxType === "olga" ? "P2WSH" : "P2SH"].size,
          isWitness: trxType === "olga",
          value: this.DUST_SIZE + index
        }))
      ],
      satsPerVB,
      {
        includeChangeOutput: change > this.DUST_SIZE,
        changeOutputType: trxType === "olga" ? "P2WPKH" : "P2SH",
        isMultisig: trxType === "multisig"
      }
    );

    // Add verification logging
    logger.debug("stamps", {
      message: "Transaction fee verification",
      data: {
        inputs: inputs.map(input => ({
          txid: input.txid,
          vout: input.vout,
          value: input.value
        })),
        outputs: [
          ...vouts.map(vout => ({
            value: vout.value,
            isReal: vout.isReal
          })),
          ...(change > this.DUST_SIZE ? [{
            value: change,
            isChange: true
          }] : [])
        ],
        feeBreakdown: {
          totalInput: inputs.reduce((sum, input) => sum + Number(input.value), 0),
          totalOutput: vouts.reduce((sum, vout) => sum + Number(vout.value), 0) + 
            (change > this.DUST_SIZE ? change : 0),
          calculatedFee: estMinerFee,
          actualFee: inputs.reduce((sum, input) => sum + Number(input.value), 0) -
            (vouts.reduce((sum, vout) => sum + Number(vout.value), 0) + 
            (change > this.DUST_SIZE ? change : 0)),
          txVsize,
          effectiveFeeRate: estMinerFee / txVsize
        }
      }
    });

    // Add debug logging for ancestor-aware fee calculation
    logger.debug("stamps", {
      message: "Ancestor-aware fee calculation details",
      data: {
        requestedFeeRate: satsPerVB,
        calculatedFee: estMinerFee,
        effectiveFeeRate: estMinerFee / (estimatedTxSize / 4),
        ancestorCount: utxoAncestors.length,
        ancestors: utxoAncestors,
        estimatedTxSize,
        inputs: inputs.map(input => ({
          txid: input.txid,
          vout: input.vout,
          hasAncestor: utxoAncestors.some(a => a.txid === input.txid && a.vout === input.vout)
        }))
      }
    });

    // Add debug logging for fee calculation
    logger.debug("stamps", {
      message: "Fee calculation details",
      data: {
        requestedFeeRate: satsPerVB,
        calculatedFee: estMinerFee,
        effectiveFeeRate: estMinerFee / (estimatedTxSize / 4),
        transactionType: trxType,
        isMultisig: trxType === "multisig",
        inputs: inputs.map(input => ({
          txid: input.txid,
          vout: input.vout,
          type: getScriptTypeInfo(input.script).type,
          ancestor: utxoAncestors.find(a => a.txid === input.txid && a.vout === input.vout)
        })),
        estimatedTxSize,
        totalWeight: estimatedTxSize * 4
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

    // Create PSBT
    psbt = new Psbt({ network });

    // Add inputs
    for (const input of inputs) {
      const txDetails = await QuicknodeService.getTransaction(input.txid);
      if (!txDetails) {
        throw new Error(`Failed to fetch transaction details for ${input.txid}`);
      }

      const psbtInput = this.createPsbtInput(input, txDetails);
      psbt.addInput(psbtInput);
    }

    // Add outputs
    for (const vout of vouts) {
      try {
        psbt.addOutput({
          script: vout.script,
          value: BigInt(vout.value)
        });
      } catch (error) {
        logger.error("stamps", {
          message: "Error adding output to PSBT",
          error: error instanceof Error ? error.message : String(error),
          output: {
            isReal: vout.isReal,
            hasScript: !!vout.script,
            value: vout.value,
            scriptHex: Array.from(vout.script)
              .map(b => b.toString(16).padStart(2, '0'))
              .join('')
          }
        });
        throw error;
      }
    }

    // Add change output if needed
    if (change > this.DUST_SIZE) {
      const changeScript = address.toOutputScript(effectiveChangeAddress, network);
      psbt.addOutput({
        script: changeScript,
        value: BigInt(change)
      });
    }

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
    try {
      // Parse action if it's a string
      const parsedAction = typeof src20Action === "string" 
        ? JSON.parse(src20Action) 
        : src20Action;

      // Ensure protocol field is uppercase
      const normalizedAction = {
        ...parsedAction,
        p: "SRC-20" // Always use uppercase for protocol
      };

      // First encode the action data as JSON
      const actionString = JSON.stringify(normalizedAction);
      const jsonData = new TextEncoder().encode(actionString);

      // Create the stamp prefix
      const stampPrefix = new TextEncoder().encode(this.STAMP_PREFIX);
      
      // Combine stamp prefix and JSON data first (without length prefix)
      const dataWithPrefix = new Uint8Array([...stampPrefix, ...jsonData]);
      
      // Calculate length
      const dataLength = dataWithPrefix.length;

      // Create hex string in correct format for CIP33
      const hex_data = Array.from(dataWithPrefix)
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');

      // Debug log the exact format
      console.log("Data Format:", {
        stampPrefix: Array.from(stampPrefix).map(b => b.toString(16).padStart(2, '0')).join(''),
        jsonData: Array.from(jsonData).map(b => b.toString(16).padStart(2, '0')).join(''),
        hex_data,
        dataLength,
        stampPrefixLength: stampPrefix.length,
        jsonDataLength: jsonData.length,
        normalizedAction
      });

      // Let CIP33 handle length prefix and chunking
      const cip33Addresses = CIP33.file_to_addresses(hex_data);
      if (!cip33Addresses || cip33Addresses.length === 0) {
        throw new Error("Failed to generate CIP33 addresses");
      }

      return {
        actionData: jsonData,
        finalData: dataWithPrefix,
        hex_data,
        chunks: cip33Addresses
      };
    } catch (error) {
      logger.error("stamps", {
        message: "Error in prepareActionData",
        error: error instanceof Error ? error.message : String(error)
      });
      throw error;
    }
  }

  private static createAddressOutput(
    address: string, 
    value: number
  ): { script: Uint8Array; value: number; isReal?: boolean } {
    if (!address) {
      throw new Error("Invalid address: address is undefined");
    }

    // Convert bech32 address to script
    const scriptHash = CIP33.cip33_bech32toHex(address);
    if (!scriptHash) {
      throw new Error(`Invalid CIP33 address: ${address}`);
    }

    // Create P2WSH script
    const script = new Uint8Array([
      0x00, // witness version
      0x20, // push 32 bytes
      ...scriptHash.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    ]);

    return { 
      script,
      value,
      isReal: false
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
    // Let CIP33 handle the chunking and address generation
    const addresses = CIP33.file_to_addresses(hex_data);
    if (!addresses || addresses.length === 0) {
      throw new Error("Failed to generate CIP33 addresses");
    }
    return addresses;
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

  private static calculateTotalFee(
    inputs: Array<{
      txid: string;
      vout: number;
      value: number;
      type: string;
      size: number;
      isWitness: boolean;
      hasAncestor?: boolean;
      ancestor?: {
        txid: string;
        vout: number;
        weight?: number;
      };
    }>,
    outputs: Array<{
      value: number;
      isReal?: boolean;
      isChange?: boolean;
    }>,
    satsPerVB: number
  ): { fee: number; vsize: number } {
    // Calculate base transaction size
    const baseSize = estimateTransactionSize({
      inputs: inputs.map(input => ({
        type: input.type,
        size: input.size,
        isWitness: input.isWitness
      })),
      outputs: outputs.map(output => ({
        value: output.value,
        isReal: output.isReal,
        isChange: output.isChange
      }))
    });

    // Calculate ancestor weight
    const ancestorWeight = inputs.reduce((sum, input) => {
      if (input.ancestor?.weight) {
        return sum + input.ancestor.weight;
      }
      return sum;
    }, 0);

    // Convert weight to vsize (weight units / 4)
    const ancestorVsize = Math.ceil(ancestorWeight / 4);
    
    // Total vsize including ancestors
    const totalVsize = baseSize + ancestorVsize;

    // Calculate values
    const totalInputValue = inputs.reduce((sum, input) => sum + Number(input.value), 0);
    const totalOutputValue = outputs.reduce((sum, output) => sum + Number(output.value), 0);
    
    // Calculate fee based on total vsize including ancestors
    const requestedFee = Math.ceil(totalVsize * satsPerVB);
    const actualFee = totalInputValue - totalOutputValue;
    const effectiveFeeRate = actualFee / totalVsize;

    logger.debug("stamps", {
      message: "Fee calculation with ancestors",
      data: {
        sizes: {
          baseSize,
          ancestorWeight,
          ancestorVsize,
          totalVsize
        },
        fees: {
          requested: {
            rate: satsPerVB,
            amount: requestedFee
          },
          actual: {
            amount: actualFee,
            effectiveRate: effectiveFeeRate.toFixed(1)
          }
        },
        ancestors: inputs.map(input => ({
          txid: input.txid,
          vout: input.vout,
          hasAncestor: !!input.ancestor,
          ancestorWeight: input.ancestor?.weight
        })),
        values: {
          totalInput: totalInputValue,
          totalOutput: totalOutputValue
        }
      }
    });

    return {
      fee: requestedFee,
      vsize: totalVsize
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
