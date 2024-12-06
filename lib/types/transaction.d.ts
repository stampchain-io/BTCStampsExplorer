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

// Helper type for script types
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
