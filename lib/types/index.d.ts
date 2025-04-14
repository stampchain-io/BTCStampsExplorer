import { DispenserRow } from "$globals";

export * from "./services.d.ts";
export * from "./quicknode.d.ts";
export * from "./src20.d.ts";
export * from "./src101.d.ts";
export * from "./wallet.d.ts";
export * from "./marketData.d.ts";
export * from "./utils.d.ts";
export * from "./stamp.d.ts";

export {
  type AdvancedFeeCalculatorProps,
  type AncestorInfo,
  type BaseFeeCalculatorProps,
  type FeeDetails,
  type FeeEstimationParams,
  type FeeEstimationResult,
  type ScriptType,
  type SimpleFeeCalculatorProps,
  type TransactionInput,
  type TransactionOutput,
  type UTXO,
} from "./base.d.ts";

export type { BTCBalanceInfo, BTCBalanceInfoOptions } from "./wallet.d.ts";
export type { Deployment } from "./src20.d.ts";

export interface WalletData {
  balance: number;
  usdValue: number;
  address: string;
  btcPrice: number;
  fee: number;
  txCount: number;
  unconfirmedBalance: number;
  unconfirmedTxCount: number;
  stampValue: number;
  dispensers: {
    open: number;
    closed: number;
    total: number;
    items: DispenserRow[];
  };
}
