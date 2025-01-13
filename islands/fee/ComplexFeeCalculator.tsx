import { FeeCalculatorBase } from "$components/shared/fee/FeeCalculatorBase.tsx";
import type { ComplexFeeProps } from "$lib/types/base.d.ts";
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
  _userAddress,
  _outputTypes,
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
  const feeDetails = providedFeeDetails?.hasExactFees
    ? {
      minerFee: Number(providedFeeDetails.minerFee) || 0,
      dustValue: Number(providedFeeDetails.dustValue) || 0,
      totalValue: Number(providedFeeDetails.totalValue) || 0,
      hasExactFees: true,
    }
    : {
      minerFee: 0,
      dustValue: 0,
      hasExactFees: false,
      totalValue: 0,
    };

  // Log fee details for debugging
  logger.debug("stamps", {
    message: "Fee calculator state",
    data: {
      providedFees: {
        minerFee: providedFeeDetails?.minerFee,
        dustValue: providedFeeDetails?.dustValue,
        totalValue: providedFeeDetails?.totalValue,
        hasExactFees: providedFeeDetails?.hasExactFees,
      },
      finalFees: {
        minerFee: feeDetails.minerFee,
        dustValue: feeDetails.dustValue,
        totalValue: feeDetails.totalValue,
        hasExactFees: feeDetails.hasExactFees,
      },
      inputs: {
        type,
        fileSize,
        feeRate: fee,
        utxoAncestors: utxoAncestors?.length,
      },
    },
  });

  // Add debug logging for fee details
  useEffect(() => {
    if (providedFeeDetails?.hasExactFees) {
      logger.debug("stamps", {
        message: "Fee details updated",
        data: {
          minerFee: providedFeeDetails.minerFee,
          dustValue: providedFeeDetails.dustValue,
          totalValue: providedFeeDetails.totalValue,
          type,
          feeRate: fee,
        },
      });
    }
  }, [providedFeeDetails, fee]);

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
