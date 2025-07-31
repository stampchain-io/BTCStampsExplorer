/**
 * Demonstration of enhanced utility types from utils.d.ts
 * This file shows practical examples of how the new utility types work
 */

import type {
  ApiResponse,
  BitcoinAddressFormat,
  Brand,
  DeepMerge,
  DeepPartial,
  DeepRequired,
  FeeEstimate,
  FilterConfig,
  NonEmptyArray,
  OmitByValue,
  PickByValue,
  SortConfig,
  TransactionInput,
} from "./utils.d.ts";

// Example 1: Deep utility types
interface StampData {
  id: number;
  metadata: {
    name: string;
    description: string;
    attributes: {
      rarity: string;
      collection?: string;
    };
  };
  transaction: {
    hash: string;
    confirmations: number;
  };
}

// DeepPartial allows partial updates at any nesting level
const partialUpdate: DeepPartial<StampData> = {
  metadata: {
    attributes: {
      collection: "New Collection",
    },
  },
};

// DeepRequired ensures all optional properties become required
type CompleteStampData = DeepRequired<StampData>;

// Example 2: Value-based property selection
interface MixedTypes {
  name: string;
  count: number;
  active: boolean;
  total: number;
}

// Pick only number properties
type NumberProps = PickByValue<MixedTypes, number>; // { count: number, total: number }
const numbers: NumberProps = { count: 5, total: 100 };

// Omit number properties
type NonNumberProps = OmitByValue<MixedTypes, number>; // { name: string, active: boolean }
const nonNumbers: NonNumberProps = { name: "test", active: true };

// Example 3: Bitcoin-specific types
const addressFormat: BitcoinAddressFormat = "P2WPKH";

const txInput: TransactionInput = {
  txid: "1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef",
  vout: 0,
  scriptSig: "",
  sequence: 0xffffffff,
  witness: ["304402...", "03ab12..."],
};

const feeEstimate: FeeEstimate = {
  totalFee: 1500,
  feeRate: 10,
  estimatedSize: 150,
  inputCount: 2,
  outputCount: 1,
};

// Example 4: API Response wrapper
const stampResponse: ApiResponse<StampData> = {
  success: true,
  data: {
    id: 12345,
    metadata: {
      name: "Bitcoin Stamp #12345",
      description: "A rare Bitcoin stamp",
      attributes: {
        rarity: "uncommon",
        collection: "Genesis Collection",
      },
    },
    transaction: {
      hash: "abc123...",
      confirmations: 6,
    },
  },
  timestamp: Date.now(),
};

// Example 5: Type-safe merging
type UserPrefs = {
  theme: string;
  settings: {
    notifications: boolean;
  };
};

type AdminPrefs = {
  permissions: string[];
  settings: {
    adminPanel: boolean;
  };
};

type MergedPrefs = DeepMerge<UserPrefs, AdminPrefs>;
const merged: MergedPrefs = {
  theme: "dark",
  permissions: ["read", "write"],
  settings: {
    notifications: true,
    adminPanel: true,
  },
};

// Example 6: Brand types for type safety
type StampId = Brand<number, "StampId">;
type TransactionId = Brand<string, "TransactionId">;

const stampId: StampId = 12345 as StampId;
const txId: TransactionId = "abc123..." as TransactionId;

// This would cause a type error:
// const wrongAssignment: StampId = txId; // ❌ Type error

// Example 7: Array utilities
const addresses: NonEmptyArray<string> = [
  "1BvBMSEYstWetqTFn5Au4m4GFg7xJaNVN2",
  "bc1qxy2kgdygjrsqtzq2n0yrf2493p83kkfjhx0wlh",
];

// Example 8: Query building with type safety
const sortConfig: SortConfig<"timestamp" | "amount" | "confirmations"> = {
  field: "timestamp",
  order: "desc",
};

const filterConfig: FilterConfig<"status" | "amount"> = {
  field: "status",
  operator: "eq",
  value: "confirmed",
};

// Export examples for potential use in tests
export {
  addresses,
  addressFormat,
  feeEstimate,
  filterConfig,
  merged,
  nonNumbers,
  numbers,
  partialUpdate,
  sortConfig,
  stampId,
  stampResponse,
  txId,
  txInput,
};

export type {
  CompleteStampData,
  MergedPrefs,
  NonNumberProps,
  NumberProps,
  StampId,
  TransactionId,
};
