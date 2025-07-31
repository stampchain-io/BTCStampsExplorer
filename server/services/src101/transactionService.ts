import type { TX, TXError } from "$types/transaction.d.ts";
import { deploySRC101, mintSRC101, transferSRC101, setrecordSRC101, renewSRC101 } from "$server/services/src101/index.ts";
import type { IDeploySRC101, IMintSRC101, ITransferSRC101, ISetrecordSRC101, IRenewSRC101 } from "$server/types/services/src101.d.ts";
import type { SRC101InputData } from "$types/src101.d.ts";
import { logger } from "$lib/utils/monitoring/logging/logger.ts";

export class SRC101TransactionService {
  static async handleOperation(
    operation: "deploy" | "mint" | "transfer" | "setrecord" | "renew",
    body: SRC101InputData,
  ): Promise<TX | TXError> {
    logger.debug("stamps", {
      message: "Starting handleOperation",
      operation,
      body: JSON.stringify(body, null, 2)
    });

    let result: any;

    const commonParams = {
      network: "mainnet",
      changeAddress: body.changeAddress,
      sourceAddress: body.sourceAddress,
      recAddress: body.recAddress,
      feeRate: body.feeRate,
    };

    logger.debug("stamps", {
      message: "Common params prepared",
      params: commonParams
    });
    console.log("operation", operation)
    switch (operation) {
      case "deploy":
        result = await deploySRC101({
          ...commonParams,
          ...this.prepareDeploy(body),
        } as IDeploySRC101);
        break;
      case "mint":
        result = await mintSRC101({
          ...commonParams,
          ...this.prepareMint(body),
        } as IMintSRC101);
        break;
      case "transfer":
        result = await transferSRC101({
          ...commonParams,
          ...this.prepareTransfer(body),
        } as ITransferSRC101);
        break;
      case "setrecord":
        result = await setrecordSRC101({
          ...commonParams,
          ...this.prepareSetrecord(body),
        } as ISetrecordSRC101);
        break;
      case "renew":
        result = await renewSRC101({
          ...commonParams,
          ...this.prepareRenew(body),
        } as IRenewSRC101);
        break;
      default:
        return { error: "Invalid operation" } as TXError;
    }

    logger.debug("stamps", {
      message: "Operation result received",
      result: JSON.stringify(result, null, 2)
    });

    // Check if result has an error
    if ("error" in result) {
      return { error: result.error } as TXError;
    }

    // Map the result to TX format
    return {
      psbtHex: result.hex,
      fee: 0, // Default fee - actual fee calculation may need to be added
      change: 0, // Default change - actual change calculation may need to be added
    } as TX;
  }

  private static prepareDeploy(body: SRC101InputData): Omit<IDeploySRC101, "network" | "changeAddress" | "sourceAddress" | "recAddress" | "feeRate"> {
    return {
      root: body.root ?? "",
      name: body.name ?? "",
      lim: body.lim?.toString() ?? "10",
      owner: body.owner ?? "",
      rec: body.rec ?? [],
      tick: body.tick ?? "",
      pri: body.pri as Record<string, any> ?? {},
      desc: body.desc ?? "",
      mintstart: body.mintstart?.toString() ?? "0",
      mintend: body.mintend?.toString() ?? "18446744073709551615",
      wla: body.wla ?? "",
      imglp: body.imglp ?? "",
      imgf: body.imgf ?? "",
      idua: body.idua?.toString() ?? "999",
      description: body.description ?? "",
    };
  }

  private static prepareMint(body: SRC101InputData): Omit<IMintSRC101, "network" | "changeAddress" | "sourceAddress" | "recAddress" | "feeRate"> {
    return {
      toaddress: body.toaddress ?? "",
      hash: body.hash ?? "",
      tokenid: Array.isArray(body.tokenid) ? body.tokenid : [body.tokenid ?? ""],
      dua: body.dua?.toString() ?? "",
      prim: body.prim ?? "true",
      sig: body.sig ?? "",
      img: Array.isArray(body.img) ? body.img : (body.img ? [body.img] : null),
      coef: body.coef?.toString() ?? "1000",
    };
  }

  private static prepareTransfer(body: SRC101InputData): Omit<ITransferSRC101, "network" | "changeAddress" | "sourceAddress" | "recAddress" | "feeRate"> {
    return {
      toaddress: body.toaddress ?? "",
      hash: body.hash ?? "",
      tokenid: Array.isArray(body.tokenid) ? body.tokenid[0] ?? "" : body.tokenid ?? "",
    };
  }

  private static prepareSetrecord(body: SRC101InputData): Omit<ISetrecordSRC101, "network" | "changeAddress" | "sourceAddress" | "recAddress" | "feeRate"> {
    return {
      hash: body.hash ?? "",
      tokenid: Array.isArray(body.tokenid) ? body.tokenid[0] ?? "" : body.tokenid ?? "",
      type: body.type ?? "",
      data: body.data ?? {},
      prim: body.prim ?? "",
    };
  }

  private static prepareRenew(body: SRC101InputData): Omit<IRenewSRC101, "network" | "changeAddress" | "sourceAddress" | "recAddress" | "feeRate"> {
    return {
      hash: body.hash ?? "",
      tokenid: Array.isArray(body.tokenid) ? body.tokenid[0] ?? "" : body.tokenid ?? "",
      dua: body.dua?.toString() ?? "",
    };
  }
}
