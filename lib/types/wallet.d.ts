import { WalletProviderKey } from "$lib/utils/constants.ts";
import { Dispenser, DispenserStats } from "./services.d.ts";
import { StampRow } from "globals";

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

export interface BtcBalance {
  confirmed: number;
  unconfirmed: number;
  total: number;
}

export interface Wallet {
  address?: string;
  publicKey?: string;
  accounts: any[];
  btcBalance: BtcBalance;
  stampBalance: StampBalance[];
  type?: "legacy" | "segwit";
  provider?: WalletProviderKey;
  network?: "mainnet" | "testnet";
  addressType?: "p2wpkh" | "p2tr";
}

// Base interface for Bitcoin address information (flexible)
export interface BTCAddressInfo {
  address: string;
  balance: number;
  txCount: number;
  unconfirmedBalance: number;
  unconfirmedTxCount: number;
  usdValue?: number; // Optional in base interface
  btcPrice?: number; // Optional in base interface
}

// Interface for wallet overview display that requires all fields
export interface WalletOverviewInfo extends BTCAddressInfo {
  usdValue: number; // Required in UI
  btcPrice: number; // Required in UI
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
  dispensers: WalletData["dispensers"];
  setShowItem: (type: string) => void;
}

// Interface for paginated data
export interface PaginatedData {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
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
  dispensers: Dispenser[];
}

// Props interface for the wallet page
export interface WalletPageProps {
  data: {
    data: WalletPageData;
    address: string;
    walletData: WalletData;
    stampsTotal: number;
    src20Total: number;
  };
}
