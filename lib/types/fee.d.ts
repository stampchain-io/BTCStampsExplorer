import type { AncestorInfo, ScriptType } from "./index.d.ts";
import type { FeeDetails } from "./base.d.ts";

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

export interface ComplexFeeProps
  extends Omit<BaseFeeCalculatorProps, "feeDetails"> {
  type: "stamp" | "src20" | "fairmint" | "transfer" | "src20-transfer";
  fileType?: string;
  fileSize?: number;
  issuance?: number;
  recipientAddress?: string;
  userAddress?: string;
  inputType?: ScriptType;
  outputTypes?: ScriptType[];
  utxoAncestors?: AncestorInfo[];
  feeDetails?: FeeDetails;
  onRefresh?: () => void;
  disabled?: boolean;
}
