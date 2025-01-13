export interface UTXO {
  txid: string;
  vout: number;
  value: number;
  script: string;
  ancestorCount?: number;
  ancestorSize?: number;
  ancestorFees?: number;
  ancestor?: AncestorInfo;
  vsize?: number;
  weight?: number;
  scriptType?: string;
  scriptDesc?: string;
  witness?: string[];
  coinbase?: boolean;
}

export interface AncestorInfo {
  fees: number;
  vsize: number;
  effectiveRate: number;
  txid?: string;
  vout?: number;
  weight?: number;
  size?: number; // Raw size in bytes
  scriptType?: string; // Type of input script
  witness?: string[]; // Witness data of ancestor
  sequence?: number; // Sequence number (useful for RBF)
  blockHeight?: number; // Height when confirmed
  confirmations?: number; // Number of confirmations
}

export interface TransactionInput {
  type: ScriptType;
  isWitness: boolean;
  size: number;
  ancestor?: AncestorInfo;
}

export interface TransactionOutput {
  type: ScriptType;
  value: number;
  isWitness: boolean;
  size: number;
}

export interface FeeEstimationParams {
  type: "transfer" | "stamp" | "src20" | "fairmint" | "src20-transfer";
  fileSize?: number;
  feeRate: number;
  isMultisig?: boolean;
  satsPerVB?: number;
  satsPerKB?: number;
  outputTypes?: ScriptType[];
  userAddress?: string;
}

export interface FeeEstimationResult {
  minerFee: number;
  dustValue: number;
  outputs: TransactionOutput[];
  detectedInputType: ScriptType;
  estimatedSize?: number;
}

export type ScriptType = "P2PKH" | "P2WPKH" | "P2WSH" | "P2SH" | "P2TR";

export interface FeeDetails {
  minerFee: number;
  dustValue: number;
  hasExactFees: boolean;
  totalValue?: number;
  effectiveFeeRate?: number;
  estimatedSize?: number;
  totalVsize?: number;
}

export interface BaseFeeCalculatorProps {
  fee: number;
  handleChangeFee: (fee: number) => void;
  BTCPrice: number;
  isSubmitting: boolean;
  onSubmit: () => void;
  onCancel?: () => void;
  buttonName: string;
  className?: string;
  showCoinToggle?: boolean;
  tosAgreed?: boolean;
  onTosChange?: (agreed: boolean) => void;
  feeDetails?: FeeDetails;
}

export interface BasicFeeProps
  extends Omit<BaseFeeCalculatorProps, "feeDetails"> {
  type: "send" | "transfer" | "buy";
  amount?: number;
  recipientAddress?: string;
  userAddress?: string;
  inputType?: ScriptType;
  outputTypes?: ScriptType[];
  utxoAncestors?: AncestorInfo[];
}

export interface ComplexFeeProps extends BaseFeeCalculatorProps {
  type: string;
  fileType: string | undefined;
  fileSize: number | undefined;
  issuance: number | undefined;
  serviceFee: number | undefined;
  userAddress: string | undefined;
  outputTypes: ScriptType[] | undefined;
  utxoAncestors: AncestorInfo[] | undefined;
  feeDetails: FeeDetails | undefined;
  effectiveFeeRate: number | undefined;
  onRefresh: (() => Promise<void>) | undefined;
  disabled: boolean | undefined;
  inputType: string | undefined;
}

interface PSBTFees extends FeeDetails {
  // Additional PSBT-specific fields if needed
}

export interface BTCBalance {
  confirmed: number;
  unconfirmed: number;
  total?: number;
}
