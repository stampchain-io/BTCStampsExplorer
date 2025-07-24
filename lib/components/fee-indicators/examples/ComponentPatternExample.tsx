/**
 * Component Pattern Example
 *
 * Demonstrates how to use ProgressiveFeeStatusIndicator in custom modals
 * Used by: Trade tools, complex minting tools
 */

import { useTransactionFeeEstimator } from "$lib/hooks/useTransactionFeeEstimator.ts";
import { ProgressiveFeeStatusIndicator } from "$lib/components/fee-indicators";

interface ComponentPatternExampleProps {
  // Tool-specific props
  tradeType?: "buy" | "sell" | "swap";
  fromAsset?: string;
  toAsset?: string;
  amount?: number;
  // Common props
  wallet?: { address: string };
  isSubmitting: boolean;
}

export function ComponentPatternExample({
  tradeType,
  fromAsset,
  toAsset,
  amount,
  wallet,
  isSubmitting,
}: ComponentPatternExampleProps) {
  // 1. Use the transaction fee estimator hook
  const {
    feeDetails,
    currentPhase,
    phase1Result,
    phase2Result,
    phase3Result,
    isPreFetching,
    isEstimating,
    error,
    clearError,
  } = useTransactionFeeEstimator({
    toolType: "trade", // or your tool type
    feeRate: 1, // sat/vB
    walletAddress: wallet?.address,
    isConnected: !!wallet,
    isSubmitting,
    // Tool-specific parameters could go here
  });

  return (
    <div className="relative p-6 bg-stamp-grey-darker rounded-lg">
      {/* Modal content */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-stamp-grey-light">
          {tradeType === "buy" ? "Buy" : tradeType === "sell" ? "Sell" : "Swap"}
          {" "}
          {fromAsset}
        </h2>

        {/* Trade details */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-stamp-grey">From:</span>
            <span className="text-stamp-grey-light">{fromAsset}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-stamp-grey">To:</span>
            <span className="text-stamp-grey-light">{toAsset}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-stamp-grey">Amount:</span>
            <span className="text-stamp-grey-light">{amount}</span>
          </div>
        </div>

        {/* Fee information */}
        {feeDetails && (
          <div className="p-3 bg-stamp-grey-darker/50 rounded border border-stamp-grey-light/10">
            <div className="flex justify-between text-sm">
              <span className="text-stamp-grey">Estimated Fee:</span>
              <span className="text-stamp-grey-light">
                {feeDetails.minerFee} sats
              </span>
            </div>
          </div>
        )}

        {/* Action button */}
        <button
          className="w-full py-3 bg-stamp-purple hover:bg-stamp-purple-dark text-white rounded transition-colors"
          disabled={isSubmitting || !wallet}
        >
          {isSubmitting ? "Processing..." : "Confirm Trade"}
        </button>
      </div>

      {/* Progressive Fee Status Indicator - positioned absolutely */}
      <ProgressiveFeeStatusIndicator
        isConnected={!!wallet}
        isSubmitting={isSubmitting}
        currentPhase={currentPhase}
        phase1Result={phase1Result}
        phase2Result={phase2Result}
        phase3Result={phase3Result}
        isPreFetching={isPreFetching}
        feeEstimationError={error?.message || null}
        clearError={clearError}
      />
    </div>
  );
}
