import type { TX, TXError } from "$types/transaction.d.ts";
import { logger } from "$lib/utils/monitoring/logging/logger.ts";
import type { IDeploySRC20, IMintSRC20, ITransferSRC20 } from "$server/types/services/src20.d.ts";
import type { InputData } from "$types/src20.d.ts";
import { SRC20OperationService } from "$server/services/src20/operations/src20Operations.ts";

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
        result = await SRC20OperationService.deploySRC20({
          ...commonParams,
          ...this.prepareDeploy(body),
        } as IDeploySRC20);
        break;
      case "mint":
        if (!body.amt) {
          return {
            error: "Error: amt is required for mint operation",
          };
        }
        logger.debug("stamps", {
          message: "Handling mint operation",
          mintParams: this.prepareMint(body)
        });
        result = await SRC20OperationService.mintSRC20({
          ...commonParams,
          ...this.prepareMint(body),
        } as IMintSRC20);
        break;
      case "transfer":
        if (!body.fromAddress) {
          return {
            error: "Error: fromAddress is required for transfer operation",
          };
        }
        if (!body.amt) {
          return {
            error: "Error: amt is required for transfer operation",
          };
        }
        logger.debug("stamps", {
          message: "Handling transfer operation",
          transferParams: this.prepareTransfer(body)
        });
        result = await SRC20OperationService.transferSRC20({
          ...commonParams,
          ...this.prepareTransfer(body),
        } as ITransferSRC20);
        break;
      default:
        return { error: "Invalid operation" };
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
      return { error: result.error };
    }

    // Map the result to the expected TX format
    return {
      psbtHex: result.hex || result.base64 || "",
      fee: Number(result.est_miner_fee || 0),
      change: Number(result.change_value || 0)
    };
  }

  private static prepareDeploy(body: InputData): IDeploySRC20 {
    if (!body.toAddress || !body.changeAddress || body.feeRate === undefined) {
      throw new Error("Missing required fields: toAddress, changeAddress, or feeRate");
    }
    return {
      network: "mainnet",
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
      description: (body.description || body.desc) ?? "",
    };
  }

  private static prepareMint(body: InputData): IMintSRC20 {
    return {
      toAddress: body.toAddress ?? "",
      changeAddress: body.changeAddress ?? "",
      tick: body.tick,
      feeRate: body.feeRate ?? 1,
      amt: body.amt?.toString() ?? "",
      network: "mainnet", // Default to mainnet
    };
  }

  private static prepareTransfer(body: InputData): ITransferSRC20 {
    return {
      toAddress: body.toAddress ?? "",
      fromAddress: body.fromAddress ?? "",
      changeAddress: body.changeAddress ?? "",
      tick: body.tick,
      feeRate: body.feeRate ?? 1,
      amt: body.amt?.toString() ?? "",
      network: "mainnet", // Default to mainnet
    };
  }
}
