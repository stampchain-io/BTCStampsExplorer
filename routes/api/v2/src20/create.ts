import { Handlers } from "$fresh/server.ts";
import { InputData, TX, TXError } from "globals";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { SRC20Service } from "$server/services/src20/index.ts";

type TrxType = "multisig" | "olga";

export const handler: Handlers<TX | TXError> = {
  async POST(req: Request) {
    try {
      const rawBody = await req.text();
      console.log("SRC-20 request body:", rawBody);

      const body: InputData & { trxType?: TrxType } = JSON.parse(rawBody);
      const trxType = body.trxType || "olga"; // Default to olga if not specified

      // Common validation for both types
      const requiredFields = [
        "toAddress",
        "sourceAddress",
        "op",
        "tick",
        "feeRate",
      ] as const;

      // Type-safe field checking
      for (const field of requiredFields) {
        if (!body[field]) {
          return ResponseUtil.error(`${field} is required`, 400);
        }
      }

      // Validate addresses
      if (body.changeAddress && body.changeAddress === body.sourceAddress) {
        console.log(
          "changeAddress matches sourceAddress, using sourceAddress for both",
        );
      } else if (body.changeAddress) {
        console.log("Using different addresses for source and change");
        // Additional validation could be added here if needed
      }

      // Use sourceAddress as changeAddress if not provided
      const effectiveChangeAddress = body.changeAddress || body.sourceAddress;
      const sourceWallet = body.sourceAddress;

      // Operation-specific validations
      if (body.op === "mint" && !body.amt) {
        return ResponseUtil.error("amt is required for mint operation", 400);
      }
      if (body.op === "transfer" && (!body.fromAddress || !body.amt)) {
        return ResponseUtil.error(
          "fromAddress and amt are required for transfer operation",
          400,
        );
      }

      // Use the utility service for common checks
      const { UtilityService } = SRC20Service;
      await UtilityService.performChecks(body.op, {
        ...body,
        changeAddress: effectiveChangeAddress,
      });

      if (trxType === "multisig") {
        // Handle multisig transaction
        const result = await SRC20Service.TransactionService.handleOperation(
          body.op.toLowerCase() as "deploy" | "mint" | "transfer",
          {
            ...body,
            changeAddress: effectiveChangeAddress,
            sourceAddress: sourceWallet,
          },
        );
        return ResponseUtil.success(result);
      } else {
        // Handle Olga/p2wsh transaction
        const src20Action = {
          op: body.op.toUpperCase(),
          p: "SRC-20",
          tick: body.tick,
          ...(body.max && { max: body.max.toString() }),
          ...(body.lim && { lim: body.lim.toString() }),
          ...(body.dec !== undefined && { dec: Number(body.dec) }),
          ...(body.amt && { amt: body.amt.toString() }),
          ...(body.x && { x: body.x }),
          ...(body.web && { web: body.web }),
          ...(body.email && { email: body.email }),
          ...(body.tg && { tg: body.tg }),
          ...(body.description && { description: body.description }),
        };

        const psbtData = await SRC20Service.PSBTService.preparePSBT({
          sourceWallet, // Use sourceAddress for UTXO selection
          toAddress: body.toAddress,
          src20Action,
          satsPerVB: Number(body.feeRate),
          service_fee: 0,
          service_fee_address: "",
          changeAddress: effectiveChangeAddress, // Add changeAddress parameter
        });

        return ResponseUtil.success({
          hex: psbtData.psbt.toHex(),
          base64: psbtData.psbt.toBase64(),
          est_tx_size: psbtData.estimatedTxSize,
          input_value: psbtData.totalInputValue,
          total_dust_value: psbtData.totalDustValue,
          est_miner_fee: psbtData.estMinerFee,
          change_value: psbtData.totalChangeOutput,
          inputsToSign: psbtData.psbt.data.inputs.map((_, index) => index),
          sourceAddress: sourceWallet,
          changeAddress: effectiveChangeAddress,
        });
      }
    } catch (error: unknown) {
      console.error("Error processing request:", error);
      if (error instanceof SyntaxError) {
        return ResponseUtil.error("Invalid JSON in request body", 400);
      }
      return ResponseUtil.error(
        error instanceof Error ? error.message : "Unknown error occurred",
        400,
      );
    }
  },
};
