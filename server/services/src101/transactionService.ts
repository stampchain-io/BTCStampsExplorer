import { TX, TXError } from "$globals";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import { deploySRC101, mintSRC101, transferSRC101, setrecordSRC101, renewSRC101 } from "./index.ts";
import type { IDeploySRC101, IMintSRC101, ITransferSRC101, ISetrecordSRC101, IRenewSRC101 } from "$types/index.d.ts";
import { SRC101InputData } from "$types/index.d.ts";
import { logger } from "$lib/utils/logger.ts";

export class SRC101TransactionService {
  static async handleOperation(
    operation: "deploy" | "mint" | "transfer" | "setrecord" | "renew",
    body: SRC101InputData,
    trxType: "olga" | "multisig"
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
      sourceAddress: body.sourceAddress,
      recAddress: body.recAddress,  
      feeRate: body.feeRate || body.satsPerVB,
      satsPerVB: body.satsPerVB || body.feeRate,
      trxType: trxType,
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
        return ResponseUtil.badRequest("Invalid operation", 400);
    }

    return result;
  }

  private static prepareDeploy(body: SRC101InputData): IDeploySRC101 {
    return {
      changeAddress: body.changeAddress,
      sourceAddress: body.sourceAddress,
      root: body.root,
      name: body.name,
      lim: body.lim?.toString() ?? "10",
      owner: body.owner,
      rec: body.rec,
      tick: body.tick,
      pri: body.pri,
      desc: body.desc,
      feeRate: body.feeRate,
      mintstart: body.mintstart?.toString() ?? "0",
      mintend: body.mintend?.toString() ?? "18446744073709551615",
      wla: body.wla ?? "",
      imglp: body.imglp ?? "",
      imgf: body.imgf ?? "",
      idua: body.idua.toString() ?? "999",
      description: body.description ?? "",
    };
  }

  private static prepareMint(body: SRC101InputData): IMintSRC101 {
    return {
      sourceAddress: body.sourceAddress,
      changeAddress: body.changeAddress,
      recAddress: body.recAddress,
      toaddress: body.toaddress,
      hash: body.hash,
      tokenid: body.tokenid,
      dua: body.dua.toString(),
      prim: body.prim ?? "true",
      sig: body.sig ?? "",
      img:body.img,
      coef: body.coef.toString() ?? "1000",
      feeRate: body.feeRate,
    };
  }

  private static prepareTransfer(body: SRC101InputData): ITransferSRC101 {
    return {
      fromAddress: body.sourceAddress,
      sourceAddress: body.sourceAddress,
      changeAddress: body.changeAddress,
      recAddress: body.recAddress,
      toaddress: body.toaddress,
      hash: body.hash,
      tokenid: body.tokenid,
      feeRate: body.feeRate,
    };
  }

  private static prepareSetrecord(body: SRC101InputData): ISetrecordSRC101 {
    return {
      sourceAddress: body.sourceAddress,
      changeAddress: body.changeAddress,
      recAddress: body.recAddress,
      toaddress: body.toaddress,
      hash: body.hash,
      tokenid: body.tokenid,
      type: body.type,
      data: body.data,
      prim: body.prim,
      feeRate: body.feeRate,
    };
  }

  private static prepareRenew(body: SRC101InputData): IRenewSRC101 {
    return {
      sourceAddress: body.sourceAddress,
      changeAddress: body.changeAddress,
      recAddress: body.recAddress,
      toaddress: body.toaddress,
      hash: body.hash,
      tokenid: body.tokenid,
      dua: body.dua.toString(),
      feeRate: body.feeRate,
    };
  }
}
