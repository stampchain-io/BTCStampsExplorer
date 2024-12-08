import type { TransactionInput, TransactionOutput } from "./transaction.d.ts";

// Import StampRow and SRC20Row from globals
import type { SRC20Row, StampRow } from "$globals";

// Base transaction interface with common properties
interface BaseTransaction {
  block_index: number;
  tx_hash: string;
  inputs: TransactionInput[];
  outputs: TransactionOutput[];
}

// For StampCard transactions - extend both StampRow and BaseTransaction
export interface StampTransaction extends StampRow, BaseTransaction {
  stamp_type: string;
  file_hash: string;
  file_size: number;
}

// For SRC20 transactions - extend both SRC20Row and BaseTransaction
export interface SRC20Transaction extends SRC20Row, BaseTransaction {
  progress: string;
}

// Props interfaces for each component
export interface StampingProps {
  transactions: StampTransaction[];
}

export interface SRC20MintingProps {
  transactions: SRC20Transaction[];
}

export interface TransferProps {
  transactions: StampTransaction[];
}

export interface DeployProps {
  transactions: StampTransaction[];
}
