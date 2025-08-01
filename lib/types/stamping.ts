import type { BaseTransaction } from "$types/utils.d.ts";
import type { TransactionInput, TransactionOutput } from "$types/base.d.ts";
import type {
  DeployProps,
  SRC20MintingProps,
  StampingProps,
  TransferProps,
} from "$types/ui.d.ts";

// Import StampRow and SRC20Row from domain types
import type { SRC20Row } from "$types/src20.d.ts";
import type { StampRow } from "$types/stamp.d.ts";

// Base transaction interface with common properties

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
