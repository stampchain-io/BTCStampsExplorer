import { TX, TXError } from "globals";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { deploySRC20, mintSRC20, transferSRC20 } from "./index.ts";
import type { IDeploySRC20, IMintSRC20, ITransferSRC20 } from "$types/index.d.ts";
import { InputData } from "$types/index.d.ts";
import { logger } from "$lib/utils/logger.ts";

export class SRC20TransactionService {
  static async handleOperation(
    operation: "deploy" | "mint" | "transfer",
    body: InputData,
  ): Promise<TX | TXError> {
    logger.debug("stamps", {
      message: "Starting handleOperation",
      operation,
      body: JSON.stringify(body, null, 2)
    });

    let result;

    const commonParams = {
      network: "mainnet",
      changeAddress: body.changeAddress,
      toAddress: body.toAddress,
      feeRate: body.feeRate,
    };

    logger.debug("stamps", {
      message: "Common params prepared",
      params: commonParams
    });

    switch (operation) {
      case "deploy":
        logger.debug("stamps", {
          message: "Handling deploy operation",
          deployParams: this.prepareDeploy(body)
        });
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
        logger.debug("stamps", {
          message: "Handling mint operation",
          mintParams: this.prepareMint(body)
        });
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
        logger.debug("stamps", {
          message: "Handling transfer operation",
          transferParams: this.prepareTransfer(body)
        });
        result = await transferSRC20({
          ...commonParams,
          ...this.prepareTransfer(body),
        } as ITransferSRC20);
        break;
      default:
        return ResponseUtil.error("Invalid operation", 400);
    }

    logger.debug("stamps", {
      message: "Operation result received",
      result: JSON.stringify(result, null, 2)
    });

    if ("error" in result) {
      logger.error("stamps", {
        message: "Operation error",
        error: result.error
      });
      return ResponseUtil.error(result.error, 400);
    }

    return result;
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
