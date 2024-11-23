import { WalletProviderKey } from "$lib/utils/constants.ts";
import { DispenserStats } from "./services.d.ts";

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

// Base interface for Bitcoin address information
export interface BTCAddressInfo {
  address: string;
  balance: number;
  txCount: number;
  unconfirmedBalance: number;
  unconfirmedTxCount: number;
  usdValue: number;
  btcPrice: number;
}

// Extended interface for wallet data that includes dispenser stats
export interface WalletData extends BTCAddressInfo {
  fee: number;
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
