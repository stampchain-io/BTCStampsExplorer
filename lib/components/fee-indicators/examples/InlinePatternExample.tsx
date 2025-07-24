/**
 * Inline Pattern Example
 *
 * Demonstrates the full StampingTool pattern with inline indicators
 * Used by: StampingTool and other advanced tools
 */

import { useTransactionFeeEstimator } from "$lib/hooks/useTransactionFeeEstimator.ts";
import { InlinePhaseIndicator } from "$lib/components/fee-indicators";
import { FeeCalculatorBase } from "$section";
import { mapProgressiveFeeDetails } from "$lib/utils/fee-estimation-utils.ts";

interface InlinePatternExampleProps {
  // Tool-specific props
  file?: File | null;
  issuance?: number;
  // Common props
  wallet?: { address: string };
  isSubmitting: boolean;
  onSubmit: () => void;
}

export function InlinePatternExample({
  file,
  issuance = 1,
  wallet,
  isSubmitting,
  onSubmit,
}: InlinePatternExampleProps) {
  // 1. Use the transaction fee estimator hook with all options
  const {
    feeDetails: progressiveFeeDetails,
    currentPhase,
    phase1Result,
    phase2Result,
    phase3Result,
    isPreFetching,
    isEstimating,
    error: feeEstimationError,
    clearError,
  } = useTransactionFeeEstimator({
    toolType: "stamp",
    feeRate: 1,
    walletAddress: wallet?.address,
    isConnected: !!wallet,
    isSubmitting,
    // Tool-specific parameters
    fileType: file?.type,
    fileSize: file?.size || 0,
    issuance,
  });

  // 2. Map progressive fee details
  const feeDetails = mapProgressiveFeeDetails(progressiveFeeDetails) || {
    minerFee: 0,
    dustValue: 0,
    totalValue: 0,
    hasExactFees: false,
    estimatedSize: 300,
  };

  return (
    <div className="space-y-6">
      {/* Tool form/content */}
      <div className="p-6 bg-stamp-grey-darker rounded-lg">
        <h2 className="text-xl font-bold text-stamp-grey-light mb-4">
          Stamp File
        </h2>

        {/* File upload UI */}
        <div className="p-4 border-2 border-dashed border-stamp-grey rounded-lg">
          {file
            ? (
              <div className="text-sm text-stamp-grey-light">
                <p>File: {file.name}</p>
                <p>Size: {(file.size / 1024).toFixed(2)} KB</p>
                <p>Type: {file.type}</p>
              </div>
            )
            : (
              <p className="text-stamp-grey text-center">
                Drop file here or click to upload
              </p>
            )}
        </div>

        {/* Issuance input */}
        <div className="mt-4">
          <label className="block text-sm text-stamp-grey mb-2">
            Issuance Quantity
          </label>
          <input
            type="number"
            value={issuance}
            className="w-full p-2 bg-stamp-grey-darker border border-stamp-grey rounded"
            min={1}
          />
        </div>
      </div>

      {/* Fee Calculator with inline indicators */}
      <div className="relative">
        <FeeCalculatorBase
          fee={1}
          handleChangeFee={() => {}}
          type="stamp"
          fileType={file?.type}
          fileSize={file?.size}
          issuance={issuance}
          isSubmitting={isSubmitting}
          onSubmit={onSubmit}
          buttonName={wallet ? "STAMP" : "CONNECT WALLET"}
          feeDetails={feeDetails}
          disabled={!file || !wallet}
        />

        {/* Inline Phase Indicator - positioned absolutely like StampingTool */}
        <InlinePhaseIndicator
          currentPhase={currentPhase}
          phase1Result={phase1Result}
          phase2Result={phase2Result}
          phase3Result={phase3Result}
          isPreFetching={isPreFetching}
          isEstimating={isEstimating}
          isConnected={!!wallet}
          isSubmitting={isSubmitting}
          feeEstimationError={feeEstimationError}
          clearError={clearError}
          className="absolute top-3 right-3 z-10"
        />
      </div>
    </div>
  );
}
