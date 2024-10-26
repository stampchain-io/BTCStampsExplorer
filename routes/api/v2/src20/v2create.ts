import { FreshContext, Handlers } from "$fresh/server.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { prepareSrc20PSBT } from "$server/utils/transactions/olgaSRC20PSBTCreate.ts";
import { TX, TXError } from "globals";

export const handler: Handlers<TX | TXError> = {
  async POST(req: Request, _ctx: FreshContext) {
    let body;
    try {
      body = await req.json();
    } catch (_error) {
      return ResponseUtil.error("Invalid JSON format in request body", 400);
    }

    const {
      sourceWallet,
      toAddress,
      src20Action,
      satsPerKB,
      service_fee,
      service_fee_address,
    } = body;
    // FIXME: need to add checks on the input
    try {
      const psbtData = await prepareSrc20PSBT({
        sourceWallet,
        toAddress,
        src20Action,
        satsPerKB: Number(satsPerKB),
        service_fee: service_fee || 0,
        service_fee_address: service_fee_address || "",
      });

      console.log(
        "PSBT data being returned:",
        JSON.stringify(psbtData, null, 2),
      );
      return ResponseUtil.success({
        hex: psbtData.psbt.toHex(),
        base64: psbtData.psbt.toBase64(),
        est_tx_size: psbtData.estimatedTxSize,
        input_value: psbtData.totalInputValue,
        total_dust_value: psbtData.totalDustValue,
        est_miner_fee: psbtData.estMinerFee,
        change_value: psbtData.totalChangeOutput,
        inputsToSign: psbtData.psbt.data.inputs.map((_, index) => index),
      });
    } catch (error) {
      console.error("SRC-20 PSBT creation error:", error);
      const errorMessage = error.message ||
        "An unexpected error occurred during PSBT creation";
      return ResponseUtil.error(errorMessage, 400);
    }
  },
};
