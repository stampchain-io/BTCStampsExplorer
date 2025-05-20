import { FeeCalculatorBase } from "$components/section/FeeCalculatorBase.tsx";
import { estimateFee } from "$lib/utils/minting/feeCalculations.ts";
import type { SimpleFeeCalculatorProps } from "$lib/types/base.d.ts";
import type { Output } from "$types/index.d.ts";

export function FeeCalculatorSimple({
  fee,
  _type,
  amount, // Donation amount or Stamp Price (item price)
  receive, //Receive amount on donate
  fromPage,
  price, // Stamp Buy Modal (already covered by amount via totalPrice)
  edition, // Stamp Buy Modal
  ticker, // SRC20 DEPLOY
  limit, // SRC20 DEPLOY
  supply, // SRC20 DEPLOY
  _recipientAddress, // Not used in current fee calculation here, but FeeCalculatorBase might use it
  _userAddress, // Not used in current fee calculation here
  _inputType = "P2WPKH", // Used by estimateFee via default outputs if not overridden
  outputTypes = ["P2WPKH"], // Default outputs for fee estimation
  utxoAncestors, // Used by estimateFee
  bitname,
  transferDetails,
  mintDetails,
  serviceFeeSats, // Prop for explicit service fee
  ...baseProps
}: SimpleFeeCalculatorProps) {
  const outputs: Output[] = outputTypes.map((type) => ({
    type,
    script: "", // Script is not needed for simple P2WPKH size estimation in estimateFee
    value: amount || 0, // Value of main output (e.g., to dispenser)
  }));

  const estimatedMinerFee = estimateFee(
    outputs,
    fee,
    utxoAncestors?.length || 1,
  );

  // Determine service fee: use provided prop. If undefined or 0, no service fee.
  const actualServiceFee = serviceFeeSats && serviceFeeSats > 0
    ? serviceFeeSats
    : 0;

  // Calculate grand total value including item price, miner fee, and service fee
  const itemPrice = amount || 0;
  const grandTotalValue = itemPrice + estimatedMinerFee + actualServiceFee;

  return (
    <FeeCalculatorBase
      amount={itemPrice} // Pass original item price (used as 'amount' in some FeeCalculatorBase displays)
      receive={receive || 0} // Explicitly default to 0 if undefined at call site
      fromPage={fromPage || ""} // Explicitly default to "" if undefined at call site
      // price prop for FeeCalculatorBase might be redundant if 'amount' already represents item price
      price={price || 0} // Explicitly default to 0 if undefined
      edition={edition || 0} // Explicitly default to 0 if undefined
      ticker={ticker || ""} // Explicitly default to "" if undefined
      limit={limit || 0} // Explicitly default to 0 if undefined
      supply={supply || 0} // Explicitly default to 0 if undefined
      {...baseProps}
      // Spreads other props like tosAgreed, onSubmit, etc.
      fee={fee} // Current fee rate (sats/vB)
      bitname={bitname}
      transferDetails={transferDetails || { address: "", amount: 0, token: "" }}
      mintDetails={mintDetails || { amount: 0, token: "" }}
      feeDetails={{
        minerFee: estimatedMinerFee,
        serviceFee: actualServiceFee, // Pass the calculated service fee
        itemPrice: itemPrice, // Pass the item price explicitly
        totalValue: grandTotalValue, // This is the new grand total
        hasExactFees: true, // Assuming fees are now exact with service fee
        dustValue: 0, // Remains as is
      }}
    />
  );
}
