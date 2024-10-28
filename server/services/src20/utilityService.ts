import { convertToEmoji } from "$lib/utils/util.ts";
import { Src20Detail, InputData } from "globals";
import * as crypto from "crypto";
import { isValidBitcoinAddress } from "$lib/utils/utxoUtils.ts";
import { SRC20QueryService } from "./queryService.ts";
import { BigFloat } from "bigfloat/mod.ts";
import type { IDeploySRC20, IMintSRC20, ITransferSRC20 } from "$types/index.d.ts";

export class SRC20UtilityService {
  static formatSRC20Row(row: Src20Detail) {
    return {
      ...row,
      tick: convertToEmoji(row.tick),
      max: row.max ? row.max.toString() : null,
      lim: row.lim ? row.lim.toString() : null,
      amt: row.amt ? row.amt.toString() : null,
    };
  }

  static calculateTickHash(tick: string): string {
    const encoder = new TextEncoder();
    const data = encoder.encode(tick.toLowerCase());
    const hashBuffer = crypto.createHash("sha3-256").update(data).digest();
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
  }

  static async checkDeployedTick(tick: string) {
    const mintInfo = await SRC20QueryService.getSrc20MintProgressByTick(tick);
    return { deployed: !!mintInfo };
  }

  static async checkMintedOut(tick: string, amount: string) {
    const mintInfo = await SRC20QueryService.checkMintedOut(tick, amount);
    if (!mintInfo) {
      throw new Error("Error: Token not found");
    }
    return mintInfo;
  }

  static async checkEnoughBalance(address: string, tick: string, amount: string) {
    try {
      const params = {
        address,
        tick,
        limit: 1,
        page: 1,
      };

      const balanceData = await SRC20QueryService.fetchSrc20Balance(params);

      if (!balanceData || !balanceData.amt) {
        console.error("No SRC-20 token balance found");
        throw new Error("No SRC-20 token balance found");
      }

      if (new BigFloat(amount).gt(balanceData.amt)) {
        throw new Error("Error: Not enough SRC-20 token balance");
      }

      return true;
    } catch (error) {
      console.error(error);
      return false;
    }
  }

  static performChecks(operation: string, params: InputData) {
    switch (operation.toUpperCase()) {
      case "DEPLOY":
        this.checkDeployParams(params);
        break;
      case "MINT":
        this.checkMintParams(params);
        break;
      case "TRANSFER":
        this.checkTransferParams(params);
        break;
      default:
        throw new Error("Error: Invalid operation");
    }
  }

  static checkDeployParams(params: IDeploySRC20) {
    if (!params.toAddress || params.toAddress.trim() === "") {
      throw new Error("Error: toAddress not provided");
    }
    if (!isValidBitcoinAddress(params.toAddress)) {
      throw new Error("Error: toAddress is invalid or unsupported");
    }

    if (!params.changeAddress || params.changeAddress.trim() === "") {
      throw new Error("Error: changeAddress not provided");
    }
    if (!isValidBitcoinAddress(params.changeAddress)) {
      throw new Error("Error: changeAddress is invalid or unsupported");
    }

    if (!params.tick || typeof params.tick !== "string") {
      throw new Error("Error: tick not provided");
    }

    if (params.max && isNaN(Number(params.max))) {
      throw new Error("Error: max must be a number");
    }

    if (params.lim && isNaN(Number(params.lim))) {
      throw new Error("Error: lim must be a number");
    }

    if (params.dec !== undefined && isNaN(Number(params.dec))) {
      throw new Error("Error: dec must be a number");
    }

    if (!params.feeRate || isNaN(Number(params.feeRate))) {
      throw new Error("Error: feeRate must be a number");
    }

    // Optional field validations
    if (params.x && params.x !== "" && (params.x.length > 15 || !/^[a-zA-Z0-9_]+$/.test(params.x))) {
      throw new Error("Error: Invalid x username");
    }

    if (params.web && params.web !== "" && 
      !/^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/.test(params.web)) {
      throw new Error("Error: Invalid website address");
    }

    if (params.email && params.email !== "" && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(params.email)) {
      throw new Error("Error: Invalid email address");
    }
  }

  static checkMintParams(params: IMintSRC20) {
    if (!params.toAddress || params.toAddress.trim() === "") {
      throw new Error("Error: toAddress not provided");
    }
    if (!isValidBitcoinAddress(params.toAddress)) {
      throw new Error("Error: toAddress is invalid or unsupported");
    }

    if (!params.changeAddress || params.changeAddress.trim() === "") {
      throw new Error("Error: changeAddress not provided");
    }
    if (!isValidBitcoinAddress(params.changeAddress)) {
      throw new Error("Error: changeAddress is invalid or unsupported");
    }

    if (!params.tick || typeof params.tick !== "string") {
      throw new Error("Error: tick not provided");
    }

    if (!params.amt || isNaN(Number(params.amt))) {
      throw new Error("Error: amt must be a number");
    }

    if (!params.feeRate || isNaN(Number(params.feeRate))) {
      throw new Error("Error: feeRate must be a number");
    }
  }

  static checkTransferParams(params: ITransferSRC20) {
    if (!params.toAddress || params.toAddress.trim() === "") {
      throw new Error("Error: toAddress not provided");
    }
    if (!isValidBitcoinAddress(params.toAddress)) {
      throw new Error("Error: toAddress is invalid or unsupported");
    }

    if (!params.fromAddress || params.fromAddress.trim() === "") {
      throw new Error("Error: fromAddress not provided");
    }
    if (!isValidBitcoinAddress(params.fromAddress)) {
      throw new Error("Error: fromAddress is invalid or unsupported");
    }

    if (!params.tick || typeof params.tick !== "string") {
      throw new Error("Error: tick not provided");
    }

    if (!params.amt || isNaN(Number(params.amt))) {
      throw new Error("Error: amt must be a number");
    }

    if (!params.feeRate || isNaN(Number(params.feeRate))) {
      throw new Error("Error: feeRate must be a number");
    }
  }
}
