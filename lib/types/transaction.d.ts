// lib/types/transaction.d.ts

// REMOVE/COMMENT OUT THIS FIRST BLOCK (Original Lines 1- approx 65)
/*
export interface ScriptTypeInfo {
  type: ScriptType;
  size: number;
  isWitness: boolean;
}

export interface TransactionInput extends ScriptTypeInfo {
  ancestor?: AncestorInfo;
}

export interface TransactionOutput extends ScriptTypeInfo {
  value: number;
}

export interface AncestorInfo {
  fees: number;
  vsize: number;
  effectiveRate: number;
}

type ScriptConstant = {
  readonly size: number;
  readonly isWitness: boolean;
};

type TxConstants = {
  VERSION: number;
  MARKER: number;
  FLAG: number;
  LOCKTIME: number;
  P2PKH: ScriptConstant;
  P2SH: ScriptConstant;
  P2WPKH: ScriptConstant;
  P2WSH: ScriptConstant;
  P2TR: ScriptConstant;
  DUST_SIZE: number;
  SRC20_DUST: number;
  weightToVsize: (weight: number) => number;
};

type ScriptType = Extract<
  keyof TxConstants,
  "P2PKH" | "P2SH" | "P2WPKH" | "P2WSH" | "P2TR"
>;

interface TransactionSizeOptions {
  inputs: Array<{
    type: ScriptType;
    isWitness?: boolean;
  }>;
  outputs: Array<{
    type: ScriptType;
    isWitness?: boolean;
  }>;
  includeChangeOutput?: boolean;
  changeOutputType?: ScriptType;
}

export interface FeeEstimationParams {
  type: "stamp" | "src20" | "fairmint" | "transfer";
  fileSize?: number;
  inputType?: ScriptType;
  outputTypes?: ScriptType[];
  feeRate: number;
  isMultisig?: boolean;
}

export interface FeeEstimationResult {
  minerFee: number;
  dustValue: number;
  outputs: TransactionOutput[];
  detectedInputType?: ScriptType;
  estimatedSize?: number;
}
*/

// --- KEEP THIS SECOND BLOCK (Original Lines 66-123 approx) AS THE ONLY DEFINITIONS FOR THESE TYPES ---

// If AncestorInfo, FeeEstimationParams, FeeEstimationResult are needed and were unique in the first block,
// their definitions would need to be brought here and use the ScriptType below.
// For now, focusing on the core conflicting types.

export type ScriptType =
  | "P2PKH"
  | "P2SH"
  | "P2WPKH"
  | "P2WSH"
  | "P2TR"
  | "OP_RETURN"
  | "UNKNOWN";

export interface ScriptTypeInfo {
  type: ScriptType;
  isWitness: boolean;
  size: number;
  redeemScriptType?: ScriptTypeInfo;
}

export interface InputTypeForSizeEstimation {
  type: ScriptType;
  isWitness?: boolean;
  redeemScriptType?: ScriptType;
}

export interface OutputTypeForSizeEstimation {
  type: ScriptType;
}

export interface Output {
  script?: string;
  address?: string;
  value: number;
}

export interface UTXO {
  txid: string;
  vout: number;
  value: number;
  script: string;
  scriptType?: ScriptType;
  isWitness?: boolean;
  redeemScript?: string;
  rawTxHex?: string;
  ancestorCount?: number;
  ancestorSize?: number;
  ancestorFees?: number;
}

// Add back clean versions of FeeEstimationParams and FeeEstimationResult if they were used,
// ensuring they use the primary exported ScriptType above.
// For example:
// export interface FeeEstimationParams {
//   type: "stamp" | "src20" | "fairmint" | "transfer";
//   fileSize?: number;
//   inputType?: ScriptType; // Uses the main exported ScriptType
//   outputTypes?: ScriptType[]; // Uses the main exported ScriptType
//   feeRate: number;
//   isMultisig?: boolean;
// }

// (And similarly for FeeEstimationResult and AncestorInfo if they are still needed from the first block)
