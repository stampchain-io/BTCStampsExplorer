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

export interface TransferDetails {
  address: string;
  amount: number;
  token: string;
}

// New separate interface for stamp transfers
export interface StampTransferDetails {
  address: string;
  stamp: string;
  editions: number;
}

export interface MintDetails {
  amount: number;
  token: string;
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
  transferDetails?: TransferDetails;
  stampTransferDetails?: StampTransferDetails;
  mintDetails?: MintDetails;
}

export interface SimpleFeeCalculatorProps
  extends Omit<BaseFeeCalculatorProps, "feeDetails"> {
  type: "send" | "transfer" | "buy" | "src20";
  _type?: string;
  amount?: number;
  recipientAddress?: string;
  userAddress?: string;
  inputType?: ScriptType;
  outputTypes?: ScriptType[];
  utxoAncestors?: AncestorInfo[];
  bitname?: string;
  receive?: number;
  fromPage?: string;
  price?: number;
  edition?: number;
  ticker?: string;
  limit?: number;
  supply?: number;
}

export interface AdvancedFeeCalculatorProps extends BaseFeeCalculatorProps {
  type: string;
  fileType?: string | undefined;
  fileSize?: number | undefined;
  issuance?: number;
  serviceFee?: number | null;
  userAddress?: string | undefined;
  outputTypes?: ScriptType[];
  utxoAncestors?: AncestorInfo[];
  feeDetails?: FeeDetails;
  effectiveFeeRate?: number;
  onRefresh: () => Promise<void>;
  disabled?: boolean;
  inputType?: string;
  bitname?: string;
}

interface PSBTFees extends FeeDetails {
  // Additional PSBT-specific fields if needed
}

export interface BTCBalance {
  confirmed: number;
  unconfirmed: number;
  total?: number;
}
