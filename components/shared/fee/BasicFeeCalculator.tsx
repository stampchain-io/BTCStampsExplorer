import { FeeCalculatorBase } from "./FeeCalculatorBase.tsx";
import { estimateFee } from "$lib/utils/minting/feeCalculations.ts";
import type { BasicFeeProps } from "$lib/types/base.d.ts";
import type { Output } from "$types/index.d.ts";

export function BasicFeeCalculator({
  fee,
  _type,
  amount,
  _recipientAddress,
  _userAddress,
  _inputType = "P2WPKH",
  outputTypes = ["P2WPKH"],
  utxoAncestors,
  ...baseProps
}: BasicFeeProps) {
  const outputs: Output[] = outputTypes.map((type) => ({
    type,
    script: "",
    value: amount || 0,
  }));

  const estimatedFee = estimateFee(outputs, fee, utxoAncestors?.length || 1);

  return (
    <FeeCalculatorBase
      {...baseProps}
      fee={fee}
      feeDetails={{
        minerFee: estimatedFee,
        hasExactFees: true,
      }}
    />
  );
}
