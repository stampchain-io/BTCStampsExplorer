/**
 * Props Pattern Example
 *
 * Demonstrates how to use fee indicators with FeeCalculatorBase
 * Used by: FairmintTool, SRC-101 RegisterTool
 */

import { useTransactionFeeEstimator } from "$lib/hooks/useTransactionFeeEstimator.ts";
import { FeeCalculatorBase } from "$section";
import { SimplePhaseIndicator } from "$lib/components/fee-indicators";
import { mapProgressiveFeeDetails } from "$lib/utils/fee-estimation-utils.ts";

interface PropsPatternExampleProps {
  // Tool-specific props
  asset?: string;
  quantity?: number;
  // Common props
  wallet?: { address: string };
  onSubmit: () => void;
}

export function PropsPatternExample({
  asset,
  quantity,
  wallet,
  onSubmit,
}: PropsPatternExampleProps) {
  // 1. Use the transaction fee estimator hook
  const {
    feeDetails: progressiveFeeDetails,
    currentPhase,
    phase1Result,
    phase2Result,
    phase3Result,
    isPreFetching,
    isEstimating,
  } = useTransactionFeeEstimator({
    toolType: "fairmint", // or your tool type
    feeRate: 1, // sat/vB
    walletAddress: wallet?.address,
    isConnected: !!wallet,
    isSubmitting: false,
    // Tool-specific parameters
    issuance: quantity || 1,
  });

  // 2. Map progressive fee details for FeeCalculatorBase
  const feeDetails = mapProgressiveFeeDetails(progressiveFeeDetails) || {
    minerFee: 0,
    dustValue: 0,
    totalValue: 0,
    hasExactFees: false,
    estimatedSize: 300,
  };

  return (
    <div className="space-y-4">
      {/* Simple phase indicator above the calculator */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Fee Estimation</h3>
        <SimplePhaseIndicator
          phase1Result={phase1Result}
          phase2Result={phase2Result}
          phase3Result={phase3Result}
        />
      </div>

      {/* Standard FeeCalculatorBase with progressive props */}
      <FeeCalculatorBase
        fee={1}
        handleChangeFee={() => {}}
        type="fairmint"
        isSubmitting={false}
        onSubmit={onSubmit}
        buttonName="MINT"
        feeDetails={feeDetails}
        // Pass progressive fee props
        phase1Result={phase1Result}
        phase2Result={phase2Result}
        phase3Result={phase3Result}
        currentPhase={currentPhase}
        isPreFetching={isPreFetching}
        isEstimating={isEstimating}
      />
    </div>
  );
}
