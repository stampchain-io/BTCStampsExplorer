/**
 * Fee Mapping Helper Utilities
 *
 * Standardized utilities for mapping progressive fee details
 * across different tool patterns and architectures
 *
 * @module utils/fee-mapping-helpers
 */

import type { ProgressiveFeeEstimationResult } from "$lib/types/fee-estimation.ts";

/**
 * Map progressive fee details for Component Pattern tools
 * (Modals using ProgressiveFeeStatusIndicator)
 */
export function mapProgressiveFeeDetailsForComponent(
  progressiveFeeDetails: ProgressiveFeeEstimationResult | null,
  fallbackValues?: {
    minerFee?: number;
    dustValue?: number;
    totalValue?: number;
    estimatedSize?: number;
  },
) {
  if (!progressiveFeeDetails || typeof progressiveFeeDetails !== "object") {
    return {
      minerFee: fallbackValues?.minerFee || 0,
      dustValue: fallbackValues?.dustValue || 0,
      totalValue: fallbackValues?.totalValue || 0,
      hasExactFees: false,
      estimatedSize: fallbackValues?.estimatedSize || 300,
    };
  }

  // Handle invalid objects (arrays, non-ProgressiveFeeEstimationResult objects)
  if (
    !progressiveFeeDetails.hasOwnProperty("minerFee") ||
    !progressiveFeeDetails.hasOwnProperty("dustValue") ||
    !progressiveFeeDetails.hasOwnProperty("totalValue")
  ) {
    return {
      minerFee: fallbackValues?.minerFee || 0,
      dustValue: fallbackValues?.dustValue || 0,
      totalValue: fallbackValues?.totalValue || 0,
      hasExactFees: false,
      estimatedSize: fallbackValues?.estimatedSize || 300,
    };
  }

  return {
    minerFee: progressiveFeeDetails.minerFee,
    dustValue: progressiveFeeDetails.dustValue,
    totalValue: progressiveFeeDetails.totalValue,
    hasExactFees: progressiveFeeDetails.hasExactFees,
    estimatedSize: progressiveFeeDetails.estimatedSize,
  };
}

/**
 * Map progressive fee details for Props Pattern tools
 * (Simple tools passing phase props to FeeCalculatorBase)
 */
export function mapProgressiveFeeDetailsForProps(
  progressiveFeeDetails: ProgressiveFeeEstimationResult | null,
  phase1Result: ProgressiveFeeEstimationResult | null,
  phase2Result: ProgressiveFeeEstimationResult | null,
  phase3Result: ProgressiveFeeEstimationResult | null,
  currentPhase: "instant" | "cached" | "exact",
  isPreFetching: boolean,
  isEstimating: boolean,
) {
  const baseFeeDetails = mapProgressiveFeeDetailsForComponent(
    progressiveFeeDetails,
  );

  return {
    feeDetails: baseFeeDetails,
    // Phase results for FeeCalculatorBase to display
    phase1Result,
    phase2Result,
    phase3Result,
    currentPhase,
    isPreFetching,
    isEstimating,
  };
}

/**
 * Map progressive fee details for Inline Pattern tools
 * (Complex tools like StampingTool with custom indicators)
 */
export function mapProgressiveFeeDetailsForInline(
  progressiveFeeDetails: ProgressiveFeeEstimationResult | null,
  options?: {
    includePhaseInfo?: boolean;
    includeTimestamps?: boolean;
    formatSatoshis?: boolean;
  },
) {
  const baseFeeDetails = mapProgressiveFeeDetailsForComponent(
    progressiveFeeDetails,
  );

  if (
    !options ||
    (!options.includePhaseInfo && !options.includeTimestamps &&
      !options.formatSatoshis)
  ) {
    return baseFeeDetails;
  }

  const extendedDetails: any = { ...baseFeeDetails };

  if (options.includePhaseInfo && progressiveFeeDetails) {
    extendedDetails.phase = progressiveFeeDetails.phase;
    extendedDetails.confidence = progressiveFeeDetails.confidence;
  }

  if (options.includeTimestamps && progressiveFeeDetails) {
    extendedDetails.timestamp = progressiveFeeDetails.timestamp;
  }

  if (options.formatSatoshis) {
    extendedDetails.formattedMinerFee = formatSatoshiAmount(
      baseFeeDetails.minerFee,
    );
    extendedDetails.formattedTotalValue = formatSatoshiAmount(
      baseFeeDetails.totalValue,
    );
  }

  return extendedDetails;
}

/**
 * Format satoshi amounts with proper units
 */
export function formatSatoshiAmount(satoshis: number): string {
  if (satoshis >= 100000000) {
    return `${(satoshis / 100000000).toFixed(8)} BTC`;
  } else if (satoshis >= 10000) {
    return `${(satoshis / 100000000).toFixed(6)} BTC`;
  } else {
    return `${satoshis} sats`;
  }
}

/**
 * Calculate fee rate from total value and transaction size
 */
export function calculateFeeRate(totalValue: number, txSize: number): number {
  if (txSize <= 0) return 0;
  if (totalValue < 0) return 0; // Handle negative values gracefully
  return Math.ceil(totalValue / txSize);
}

/**
 * Map phase indicator props for reusable components
 */
export function mapPhaseIndicatorProps(
  phase1Result: ProgressiveFeeEstimationResult | null,
  phase2Result: ProgressiveFeeEstimationResult | null,
  phase3Result: ProgressiveFeeEstimationResult | null,
  currentPhase: "instant" | "cached" | "exact",
  isPreFetching: boolean,
  isEstimating: boolean,
  feeEstimationError: Error | null,
) {
  return {
    currentPhase,
    phase1Result,
    phase2Result,
    phase3Result,
    isPreFetching,
    isEstimating,
    hasError: !!feeEstimationError,
    errorMessage: feeEstimationError?.message,
  };
}

/**
 * Create phase status text for display
 */
export function getPhaseStatusText(
  currentPhase: "instant" | "cached" | "exact",
  isPreFetching: boolean,
  isEstimating: boolean,
): string {
  if (isEstimating) {
    return "Calculating exact fees...";
  }

  if (isPreFetching) {
    return "Analyzing UTXOs...";
  }

  const phaseText = {
    instant: "Instant estimate ready",
    cached: "Smart UTXO estimate ready",
    exact: "Exact calculation complete",
  };

  return phaseText[currentPhase];
}

/**
 * Determine if fee estimation is in progress
 */
export function isFeeEstimationActive(
  isPreFetching: boolean,
  isEstimating: boolean,
  isSubmitting: boolean,
): boolean {
  return (isPreFetching || isEstimating) && !isSubmitting;
}

/**
 * Map tool-specific parameters for fee estimation
 */
export function mapToolSpecificParams(
  toolType: string,
  formState: any,
): Record<string, any> {
  const baseParams: Record<string, any> = {};

  switch (toolType) {
    case "stamp":
    case "stamping":
      if (formState.fileSize) baseParams.fileSize = formState.fileSize;
      if (formState.fileType) baseParams.fileType = formState.fileType;
      if (formState.issuance) {
        baseParams.issuance = parseInt(formState.issuance, 10);
      }
      break;

    case "src20-mint":
    case "src20-deploy":
    case "src20-transfer":
      if (formState.ticker) baseParams.ticker = formState.ticker;
      if (formState.amount) baseParams.amount = formState.amount;
      if (formState.toAddress) {
        baseParams.recipientAddress = formState.toAddress;
      }
      break;

    case "src101-create":
      if (formState.bitname) baseParams.bitname = formState.bitname;
      if (formState.root) baseParams.root = formState.root;
      if (formState.toAddress && formState.root) {
        baseParams.bitname = formState.toAddress + formState.root;
      }
      break;

    case "trade":
      if (formState.orderType) baseParams.orderType = formState.orderType;
      if (formState.assetName) baseParams.assetName = formState.assetName;
      break;

    case "dispenser":
      if (formState.dispenserAddress) {
        baseParams.dispenserAddress = formState.dispenserAddress;
      }
      break;
  }

  return baseParams;
}

/**
 * Validate fee details structure
 */
export function validateFeeDetails(details: any): boolean {
  if (!details || typeof details !== "object") {
    return false;
  }

  const requiredFields = [
    "minerFee",
    "dustValue",
    "totalValue",
    "hasExactFees",
    "estimatedSize",
  ];

  // Check all required fields exist
  const hasAllFields = requiredFields.every((field) =>
    details.hasOwnProperty(field) &&
    typeof details[field] !== "undefined"
  );

  if (!hasAllFields) return false;

  // Validate types
  if (typeof details.minerFee !== "number" || isNaN(details.minerFee)) {
    return false;
  }
  if (typeof details.dustValue !== "number" || isNaN(details.dustValue)) {
    return false;
  }
  if (typeof details.totalValue !== "number" || isNaN(details.totalValue)) {
    return false;
  }
  if (typeof details.hasExactFees !== "boolean") return false;
  if (
    typeof details.estimatedSize !== "number" || isNaN(details.estimatedSize)
  ) return false;

  return true;
}

/**
 * Create error fallback fee details
 */
export function createErrorFallbackFeeDetails(error?: Error): any {
  return {
    minerFee: 0,
    dustValue: 0,
    totalValue: 0,
    hasExactFees: false,
    estimatedSize: 300,
    error: error?.message || "Fee estimation failed",
    phase: "instant" as const,
  };
}
