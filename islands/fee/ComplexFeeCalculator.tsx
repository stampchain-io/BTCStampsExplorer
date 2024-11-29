import { FeeCalculatorBase } from "$components/shared/fee/FeeCalculatorBase.tsx";
import { calculateTransactionFees } from "$lib/utils/minting/feeEstimator.ts";
import type {
  BaseFeeCalculatorProps,
  ComplexFeeProps,
  ScriptType,
} from "$lib/types/base.d.ts";
import { useEffect } from "preact/hooks";
import { logger } from "$lib/utils/logger.ts";

export function ComplexFeeCalculator({
  fee,
  handleChangeFee,
  type,
  fileType,
  fileSize,
  issuance,
  serviceFee,
  userAddress,
  outputTypes,
  utxoAncestors = [],
  feeDetails: providedFeeDetails,
  BTCPrice,
  isSubmitting,
  onSubmit,
  buttonName,
  tosAgreed,
  onTosChange,
  ...baseProps
}: ComplexFeeProps) {
  const feeDetails = providedFeeDetails?.hasExactFees ? providedFeeDetails : {
    minerFee: 0, // Will be updated after async calculation
    dustValue: 0,
    hasExactFees: false,
  };

  // Log fee details for debugging
  console.log("Fee Details:", {
    providedFees: providedFeeDetails,
    finalFees: feeDetails,
    inputs: {
      type,
      fileSize,
      feeRate: fee,
      utxoAncestors: utxoAncestors?.length,
    },
  });

  // Add debug logging for fee details
  useEffect(() => {
    if (providedFeeDetails?.hasExactFees) {
      logger.debug("stamps", {
        message: "Fee details received",
        data: {
          minerFee: providedFeeDetails.minerFee,
          dustValue: providedFeeDetails.dustValue,
          type,
          feeRate: fee,
        },
      });
    }
  }, [providedFeeDetails]);

  return (
    <FeeCalculatorBase
      {...baseProps}
      fee={fee}
      handleChangeFee={handleChangeFee}
      type={type}
      fileType={fileType}
      fileSize={fileSize}
      issuance={issuance}
      serviceFee={serviceFee}
      BTCPrice={BTCPrice}
      isSubmitting={isSubmitting}
      onSubmit={onSubmit}
      buttonName={buttonName}
      tosAgreed={tosAgreed}
      onTosChange={onTosChange}
      feeDetails={feeDetails}
    />
  );
}
