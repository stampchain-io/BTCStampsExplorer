import type { BaseTransaction } from "$types/utils.d.ts";

// Import StampRow and SRC20Row from domain types
import type { SRC20Row } from "$types/src20.d.ts";
import type { StampRow } from "$types/stamp.d.ts";

// Base transaction interface with common properties

// For StampCard transactions - extend both StampRow and BaseTransaction
export type StampTransaction = StampRow & BaseTransaction & {
  stamp_type: string;
  file_hash: string;
  file_size: number;
};

// For SRC20 transactions - extend both SRC20Row and BaseTransaction
export type SRC20Transaction = SRC20Row & BaseTransaction & {
  progress: string;
};

// Props interfaces for each component

/**
 * Stamp transfer details for tracking and processing stamp transfers
 */
export interface StampTransferDetails {
  address: string; // Destination address for the stamp transfer
  stamp: string; // Unique identifier for the stamp being transferred
  editions: number; // Number of stamp editions to transfer
  timestamp?: Date; // Optional timestamp of the transfer
  txHash?: string; // Optional transaction hash for reference
  fee?: number; // Optional transfer fee
}
