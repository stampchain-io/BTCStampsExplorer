/**
 * Fee Estimation Utilities
 *
 * Shared utility functions for progressive fee estimation across all tools
 *
 * @author BTCStampsExplorer Team
 * @version 1.0.0
 */

import type { FeeDetails } from "$types/base.d.ts";
import type { ProgressiveFeeEstimationResult as FeeEstimationResult } from "$types/fee-estimation.ts";
import type { ProgressiveFeeEstimationResult as UIProgressiveResult } from "$types/utils.d.ts";
import type { ProgressiveFeeEstimationProps } from "$types/ui.d.ts";

/**
 * Converts FeeEstimationResult to UIProgressiveResult
 */
function convertToUIProgressiveResult(
  result: FeeEstimationResult | null,
): UIProgressiveResult | null {
  if (!result) return null;

  return {
    feeDetails: {
      minerFee: result.minerFee || 0,
      dustValue: result.dustValue || 0,
      totalValue: result.totalValue || 0,
      hasExactFees: result.hasExactFees || false,
      estimatedSize: result.estimatedSize || 300,
      serviceFee: result.serviceFee,
      itemPrice: result.itemPrice,
      effectiveFeeRate: result.effectiveFeeRate,
    },
    isEstimating: false,
    estimationError: null,
    refresh: () => {},
    estimationCount: 0,
    lastEstimationTime: result.timestamp || null,
    cacheStatus: result.cacheHit ? "fresh" : "empty",
    feeDetailsVersion: 1,
    isPreFetching: false,
    preFetchedFees: null,
  };
}

/**
 * Maps progressive fee estimation result to FeeDetails interface
 * Used by all tools to ensure consistent fee details formatting
 */
export function mapProgressiveFeeDetails(
  progressiveFeeDetails: FeeEstimationResult | null,
  defaultEstimatedSize = 300,
): FeeDetails {
  if (!progressiveFeeDetails) {
    return {
      minerFee: 0,
      dustValue: 0,
      totalValue: 0,
      hasExactFees: false,
      estimatedSize: defaultEstimatedSize,
    };
  }

  const feeDetails: FeeDetails = {
    minerFee: progressiveFeeDetails.minerFee || 0,
    dustValue: progressiveFeeDetails.dustValue || 0,
    totalValue: progressiveFeeDetails.totalValue || 0,
    hasExactFees: progressiveFeeDetails.hasExactFees || false,
    estimatedSize: progressiveFeeDetails.estimatedSize || defaultEstimatedSize,
  };

  // Add optional fields only if they exist
  if (progressiveFeeDetails.serviceFee !== undefined) {
    feeDetails.serviceFee = progressiveFeeDetails.serviceFee;
  }
  if (progressiveFeeDetails.itemPrice !== undefined) {
    feeDetails.itemPrice = progressiveFeeDetails.itemPrice;
  }
  if (progressiveFeeDetails.effectiveFeeRate !== undefined) {
    feeDetails.effectiveFeeRate = progressiveFeeDetails.effectiveFeeRate;
  }
  if (progressiveFeeDetails.totalVsize !== undefined) {
    feeDetails.totalVsize = progressiveFeeDetails.totalVsize;
  }

  return feeDetails;
}

/**
 * Common progressive fee estimation props for FeeCalculatorBase
 * Ensures consistent props across all tools
 */

/**
 * Extracts progressive fee estimation props from hook result
 * Standardizes the props passed to FeeCalculatorBase
 */
export function extractProgressiveFeeProps(hookResult: {
  isEstimating?: boolean;
  isPreFetching?: boolean;
  currentPhase?: "instant" | "cached" | "exact";
  phase1Result?: FeeEstimationResult | null;
  phase2Result?: FeeEstimationResult | null;
  phase3Result?: FeeEstimationResult | null;
  error?: Error | null;
  clearError?: () => void;
}): ProgressiveFeeEstimationProps {
  const props: ProgressiveFeeEstimationProps = {};

  if (hookResult.isEstimating !== undefined) {
    props.isEstimating = hookResult.isEstimating;
  }
  if (hookResult.isPreFetching !== undefined) {
    props.isPreFetching = hookResult.isPreFetching;
  }
  if (hookResult.currentPhase !== undefined) {
    props.currentPhase = hookResult.currentPhase;
  }
  if (hookResult.phase1Result !== undefined) {
    props.phase1Result = convertToUIProgressiveResult(hookResult.phase1Result);
  }
  if (hookResult.phase2Result !== undefined) {
    props.phase2Result = convertToUIProgressiveResult(hookResult.phase2Result);
  }
  if (hookResult.phase3Result !== undefined) {
    props.phase3Result = convertToUIProgressiveResult(hookResult.phase3Result);
  }
  if (hookResult.error !== undefined) {
    props.feeEstimationError = hookResult.error;
  }
  if (hookResult.clearError !== undefined) {
    props.clearError = hookResult.clearError;
  }

  return props;
}
