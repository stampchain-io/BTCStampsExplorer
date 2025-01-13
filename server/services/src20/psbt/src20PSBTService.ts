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
  trxType?: "olga" | "multisig";
  utxos?: Array<{
    txid: string;
    vout: number;
    value: number;
    script: string;
    address: string;
  }>;
}

interface PSBTResponse {
  psbt?: Psbt;
  estimatedTxSize: number;
  totalInputValue: number;
  totalOutputValue: number;
  totalChangeOutput: number;
  totalDustValue: number;
  estMinerFee: number;
  feeDetails: {
    baseFee: number;
    ancestorFee: number;
    effectiveFeeRate: number;
    ancestorCount: number;
    totalVsize: number;
    total: number;
    minerFee: number;
    dustValue: number;
    totalValue: number;
  };
  changeAddress?: string;
  inputs: Array<{
    index: number;
    address: string;
    sighashType?: number;
  }>;
}

export class SRC20PSBTService {
  private static readonly DUST_SIZE = 420;
  private static readonly STAMP_PREFIX = "stamp:";

  // Add constants for witness sizes
  private static readonly WITNESS_SIZES = {
    P2WPKH: {
      SIGNATURE: 72,  // DER signature + sighash flag
      PUBKEY: 33,    // Compressed public key
      ITEMS_COUNT: 1  // Number of witness items
    }
  };

  static async preparePSBT({
    sourceAddress,
    toAddress,
    src20Action,
    satsPerVB,
    service_fee,
    service_fee_address,
    changeAddress,
    utxoAncestors = [],
    trxType = "olga",
  }: PSBTParams) {
    logger.debug("stamps", {
      message: "preparePSBT called",
      data: {
        sourceAddress,
        toAddress,
        satsPerVB,
        trxType,
        action: src20Action.op,
      }
    });

    const effectiveChangeAddress = changeAddress || sourceAddress;
    const network = networks.bitcoin;
    
    // 1. First prepare the action data and get CIP33 addresses
    const { chunks } = await this.prepareActionData(src20Action);

    // 2. Construct all outputs with their exact scripts and values
    const outputs = [
      // First output is the recipient
      {
        script: address.toOutputScript(toAddress, network),
        value: this.DUST_SIZE,
      },
      // Then add all CIP33 data outputs
      ...chunks.map((chunk, i) => ({
        script: address.toOutputScript(chunk, network),
        value: this.DUST_SIZE + i,
      }))
    ];

    // 3. Calculate total output value needed
    const totalOutputValue = outputs.reduce((sum, out) => sum + out.value, 0);

    // 4. Select UTXOs with the target fee rate
    const { inputs, change } = await TransactionService.UTXOService.selectUTXOsForTransaction(
      sourceAddress,
      outputs,
      satsPerVB,
      0,
      1.5,
      { filterStampUTXOs: true }
    );

    // 5. Create PSBT with actual inputs and outputs
    const psbt = new Psbt({ network });

    // Add inputs
    for (const input of inputs) {
      const txDetails = await QuicknodeService.getTransaction(input.txid);
      if (!txDetails) {
        throw new Error(`Failed to fetch transaction details for ${input.txid}`);
      }
      psbt.addInput(this.createPsbtInput(input, txDetails));
    }

    // Add all outputs
    outputs.forEach(output => {
      psbt.addOutput({
        script: output.script,
        value: BigInt(output.value)
      });
    });

    // Add change output if needed
    if (change > this.DUST_SIZE) {
      psbt.addOutput({
        script: address.toOutputScript(effectiveChangeAddress, network),
        value: BigInt(change)
      });
    }

    // 6. Calculate actual transaction fee from input/output values
    const totalInputValue = inputs.reduce((sum, input) => sum + Number(input.value), 0);
    const totalOutputAmount = outputs.reduce((sum, out) => sum + out.value, 0) + 
                             (change > this.DUST_SIZE ? change : 0);
    const actualFee = totalInputValue - totalOutputAmount;
    const dustTotal = outputs.reduce((sum, out) => sum + out.value, 0);

    // Log exact values for debugging
    logger.debug("stamps", {
      message: "Transaction details",
      data: {
        totalInputValue,
        totalOutputAmount,
        actualFee,
        dustTotal,
        changeAmount: change,
        feeBreakdown: {
          minerFee: actualFee,
          dustValue: dustTotal,
          total: actualFee + dustTotal
        },
        outputs: outputs.map(o => o.value),
        change,
        inputValues: inputs.map(i => i.value)
      }
    });

    return {
      psbt,
      estimatedTxSize: Math.ceil(actualFee / satsPerVB),
      totalInputValue,
      totalOutputValue: totalOutputAmount,
      totalChangeOutput: change,
      totalDustValue: dustTotal,
      estMinerFee: actualFee,
      feeDetails: {
        baseFee: actualFee,
        ancestorFee: 0,
        effectiveFeeRate: satsPerVB,
        ancestorCount: 0,
        totalVsize: Math.ceil(actualFee / satsPerVB),
        total: actualFee + dustTotal,
        minerFee: actualFee,
        dustValue: dustTotal,
        totalValue: actualFee + dustTotal
      },
      changeAddress: effectiveChangeAddress,
      inputs: inputs.map((input, index) => ({
        index,
        address: input.address,
        sighashType: 1
      }))
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

  private static isWitnessInput(script: string): boolean {
    const scriptType = getScriptTypeInfo(script);
    return scriptType.isWitness;
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
