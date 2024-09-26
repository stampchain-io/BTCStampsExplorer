import { prepareSrc20TX } from "./tx.ts";
import { IPrepareSRC20TX } from "$lib/types/index.d.ts";

export async function createRBFTransaction(
  originalTxParams: IPrepareSRC20TX,
  newFeeRate: number,
): Promise<string> {
  // Prepare a new transaction with the same inputs and outputs, but a higher fee
  const rbfTxParams: IPrepareSRC20TX = {
    ...originalTxParams,
    feeRate: newFeeRate,
    enableRBF: true,
  };

  const { psbtHex } = await prepareSrc20TX(rbfTxParams);

  // Sign and broadcast the new transaction
  // This part depends on your wallet integration
  // For example, with Leather wallet:
  // const signedTx = await leatherProvider.signPSBT(psbtHex, inputsToSign, true);
  // const broadcastResult = await broadcastTransaction(signedTx);

  return psbtHex; // Or return the broadcast result
}
