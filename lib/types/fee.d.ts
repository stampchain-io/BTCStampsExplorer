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

export interface FeeAlert {
  type: "warning" | "critical" | "info";
  message: string;
  currentFee: number;
  recommendedFee: number;
  threshold?: number;
}

// FeeDetails interface removed - use the one from base.d.ts instead
// This was causing conflicts with the authoritative definition in base.d.ts

export interface ToolEstimationParams {
  transactionType: "transfer" | "inscription" | "marketplace" | "other";
  dataSize: number;
  priorityLevel: "low" | "medium" | "high";
  baseFee: number;
  dynamicFeeMultiplier?: number;
  feeToken?: string;
  discountEligibility?: boolean;
  maxFeeThreshold?: number;
}
