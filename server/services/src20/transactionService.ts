import { InputData, TX, TXError } from "globals";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { deploySRC20, mintSRC20, transferSRC20 } from "$lib/utils/minting/src20/index.ts";
import type { IDeploySRC20, IMintSRC20, ITransferSRC20 } from "$lib/types/index.d.ts";

export class SRC20TransactionService {
  static async handleOperation(
    operation: "deploy" | "mint" | "transfer",
    body: InputData,
  ): Promise<TX | TXError> {
    let result;

    const commonParams = {
      network: "mainnet",
      changeAddress: body.changeAddress,
      toAddress: body.toAddress,
      feeRate: body.feeRate,
    };

    switch (operation) {
      case "deploy":
        result = await deploySRC20({
          ...commonParams,
          ...this.prepareDeploy(body),
        } as IDeploySRC20);
        break;
      case "mint":
        if (!body.amt) {
          return ResponseUtil.error(
            "Error: amt is required for mint operation",
            400,
          );
        }
        result = await mintSRC20({
          ...commonParams,
          ...this.prepareMint(body),
        } as IMintSRC20);
        break;
      case "transfer":
        if (!body.fromAddress) {
          return ResponseUtil.error(
            "Error: fromAddress is required for transfer operation",
            400,
          );
        }
        if (!body.amt) {
          return ResponseUtil.error(
            "Error: amt is required for transfer operation",
            400,
          );
        }
        result = await transferSRC20({
          ...commonParams,
          ...this.prepareTransfer(body),
        } as ITransferSRC20);
        break;
      default:
        return ResponseUtil.error("Invalid operation", 400);
    }

    if ("error" in result) {
      return ResponseUtil.error(result.error, 400);
    }

    return ResponseUtil.success({
      hex: result.psbtHex,
      inputsToSign: result.inputsToSign,
    });
  }

  private static prepareDeploy(body: InputData): IDeploySRC20 {
    return {
      toAddress: body.toAddress,
      changeAddress: body.changeAddress,
      tick: body.tick,
      feeRate: body.feeRate,
      max: body.max?.toString() ?? "",
      lim: body.lim?.toString() ?? "",
      dec: body.dec !== undefined ? Number(body.dec) : 18,
      x: body.x ?? "",
      web: body.web ?? "",
      email: body.email ?? "",
      tg: body.tg ?? "",
      description: body.description ?? "",
    };
  }

  private static prepareMint(body: InputData): IMintSRC20 {
    return {
      toAddress: body.toAddress,
      changeAddress: body.changeAddress,
      tick: body.tick,
      feeRate: body.feeRate,
      amt: body.amt.toString(),
    };
  }

  private static prepareTransfer(body: InputData): ITransferSRC20 {
    return {
      toAddress: body.toAddress,
      fromAddress: body.fromAddress,
      tick: body.tick,
      feeRate: body.feeRate,
      amt: body.amt.toString(),
    };
  }
}
