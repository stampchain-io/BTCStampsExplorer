import { WalletProviderKey } from "utils/constants.ts";

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

interface WalletData {
  address: string;
  balance: number;
  fee: number;
  usdValue: number;
  btcPrice: number;
}
