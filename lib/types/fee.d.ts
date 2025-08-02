import type { AncestorInfo, ScriptType } from "$types/index.d.ts";
import type { FeeDetails } from "$types/base.d.ts";
import type {
  AdvancedFeeCalculatorProps,
  BaseFeeCalculatorProps,
  SimpleFeeCalculatorProps,
} from "$types/ui.d.ts";

export type FeeRate = number & { __brand: "fee-rate" }; // satoshis per byte

export interface FeeEstimate {
  recommendedFee: number;
  effectiveFeeRate?: number;
  feeRateSatsPerVB?: number;
  convertedSatsPerVb?: number;
  minFeeRate?: number;
  maxFeeRate?: number;
}

export interface FeeCalculatorConfig {
  minFeeRate: number;
  maxFeeRate: number;
}

export interface FeeCalculatorResult {
  effectiveFeeRate: number;
  normalizedFees?: {
    normalizedSatsPerVB: number;
    normalizedSatsPerKB: number;
  };
}
