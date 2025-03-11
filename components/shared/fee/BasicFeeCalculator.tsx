import { FeeCalculatorBase } from "./FeeCalculatorBase.tsx";
import { estimateFee } from "$lib/utils/minting/feeCalculations.ts";
import type { BasicFeeProps } from "$lib/types/base.d.ts";
import type { Output } from "$types/index.d.ts";

export function BasicFeeCalculator({
  fee,
  _type,
  amount,
  receive, //Receive amount on donate
  fromPage,
  price, // Stamp Buy Modal
  edition, // Stamp Buy Modal
  ticker, // SRC20 DEPLOY
  limit, // SRC20 DEPLOY
  supply, // SRC20 DEPLOY
  recipientAddress,
  userAddress,
  inputType = "P2WPKH",
  outputTypes = ["P2WPKH"],
  utxoAncestors,
  bitname,
  transferDetails,
  mintDetails,
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
      amount={amount}
      receive={receive}
      fromPage={fromPage}
      price={price}
      edition={edition}
      ticker={ticker}
      limit={limit}
      supply={supply}
      {...baseProps}
      fee={fee}
      bitname={bitname}
      transferDetails={transferDetails}
      mintDetails={mintDetails}
      feeDetails={{
        minerFee: estimatedFee,
        hasExactFees: true,
      }}
    />
  );
}
