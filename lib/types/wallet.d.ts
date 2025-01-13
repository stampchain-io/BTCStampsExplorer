import { WalletProviderKey } from "$lib/utils/constants.ts";
import { Dispenser, DispenserStats } from "./services.d.ts";
import { StampRow } from "$globals";

export interface StampBalance {
  cpid?: string;
  tick?: string;
  type: "STAMP" | "SRC-20" | "SRC-721";
  quantity: number;
  decimals?: number;
  divisible?: boolean;
  stamp?: number;
  info?: any;
}

// Base interface for chain and mempool stats from Mempool API
interface BTCStatsDetail {
  funded_txo_count: number;
  funded_txo_sum: number;
  spent_txo_count: number;
  spent_txo_sum: number;
  tx_count: number;
}

// Full Mempool API response type
export interface MempoolAddressResponse {
  address: string;
  chain_stats: BTCStatsDetail;
  mempool_stats: BTCStatsDetail;
}

interface BlockCypherAddressBalanceResponse {
  address: string;
  total_received: number;
  total_sent: number;
  balance: number;
  unconfirmed_balance: number;
  final_balance: number;
  n_tx: number;
  unconfirmed_n_tx: number;
  final_n_tx: number;
}

// Basic balance interface used across the application
export interface BTCBalance {
  confirmed: number;
  unconfirmed: number;
  txCount?: number;
  unconfirmedTxCount?: number;
}

// Extended balance info with USD values and additional data
export interface BTCBalanceInfo {
  address: string;
  balance: number;
  txCount: number;
  unconfirmedBalance: number;
  unconfirmedTxCount: number;
  btcPrice?: number;
  usdValue?: number;
}

export interface BTCBalanceInfoOptions {
  includeUSD?: boolean;
  apiBaseUrl?: string;
}

export interface Wallet {
  address?: string;
  publicKey?: string;
  accounts: any[];
  btcBalance: BTCBalance;
  stampBalance: StampBalance[];
  type?: "legacy" | "segwit";
  provider?: WalletProviderKey;
  network?: "mainnet" | "testnet";
  addressType?: "p2wpkh" | "p2tr";
}

// Interface for wallet overview display that requires all fields
export interface WalletOverviewInfo extends BTCBalanceInfo {
  usdValue: number; // Required in UI (override optional)
  btcPrice: number; // Required in UI (override optional)
  fee: number; // Required for overview
}

// Extended interface for wallet data that includes dispenser stats
export interface WalletData extends WalletOverviewInfo {
  dispensers?: DispenserStats;
}

// Add the WalletStats interface
export interface WalletStatsProps {
  stampsTotal: number;
  src20Total: number;
  stampsCreated: number;
  stampValue: number;
  dispensers?: {
    open: number;
    closed: number;
    total: number;
  };
  setShowItem?: (type: string) => void;
}

// Interface for paginated data
export interface PaginatedData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  onPageChange?: (page: number) => void;
}

// Interface for wallet page data structure
export interface WalletPageData {
  stamps: {
    data: StampRow[];
    pagination: PaginatedData;
  };
  src20: {
    data: any[]; // Could be typed more specifically if we have SRC20 type
    pagination: PaginatedData;
  };
  dispensers: {
    data: Dispenser[];
    pagination: PaginatedData;
  };
}

// Props interface for the wallet page
export interface WalletPageProps {
  data: {
    data: WalletPageData;
    address: string;
    walletData: WalletData;
    stampsTotal: number;
    src20Total: number;
    stampsCreated: number;
    anchor: string;
  };
  stampsSortBy?: "ASC" | "DESC";
  src20SortBy?: "ASC" | "DESC";
  dispensersSortBy?: "ASC" | "DESC";
}

interface WalletContentProps {
  stamps: {
    data: StampRow[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  src20: {
    data: any[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  dispensers: {
    data: Dispenser[];
    pagination: {
      page: number;
      limit: number;
      total: number;
      totalPages: number;
    };
  };
  address: string;
  anchor: string;
  stampsSortBy?: "ASC" | "DESC";
  src20SortBy?: "ASC" | "DESC";
  dispensersSortBy?: "ASC" | "DESC";
}
