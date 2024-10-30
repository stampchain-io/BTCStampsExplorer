import { convertToEmoji } from "$lib/utils/util.ts";
import { Src20Detail, InputData } from "globals";
import * as crypto from "crypto";
import { isValidBitcoinAddress } from "$lib/utils/utxoUtils.ts";
import { SRC20QueryService } from "./queryService.ts";
import { BigFloat } from "bigfloat/mod.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import type { IDeploySRC20, IMintSRC20, ITransferSRC20 } from "$types/index.d.ts";
import { InputData } from "$server/types/index.d.ts";

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

  static async validateOperation(
    operation: "deploy" | "mint" | "transfer",
    body: InputData,
  ): Promise<void | TXError> {
    // Common validations for all operations
    if (!body.toAddress || !isValidBitcoinAddress(body.toAddress)) {
      return ResponseUtil.error("Invalid or missing toAddress", 400);
    }
    if (!body.tick || typeof body.tick !== "string") {
      return ResponseUtil.error("Invalid or missing tick", 400);
    }
    if (!body.feeRate || isNaN(Number(body.feeRate))) {
      return ResponseUtil.error("Invalid or missing feeRate", 400);
    }

    // Operation-specific validations
    switch (operation) {
      case "deploy":
        const deployResult = await this.validateDeploy(body);
        if (deployResult) return deployResult;
        break;

      case "mint":
        const mintResult = await this.validateMint(body);
        if (mintResult) return mintResult;
        break;

      case "transfer":
        const transferResult = await this.validateTransfer(body);
        if (transferResult) return transferResult;
        break;

      default:
        return ResponseUtil.error("Invalid operation", 400);
    }
  }

  private static async validateDeploy(body: InputData): Promise<void | TXError> {
    // Check if already deployed
    const { deployed } = await this.checkDeployedTick(body.tick);
    if (deployed) {
      return ResponseUtil.error(`Token ${body.tick} already deployed`, 400);
    }

    // Validate deploy-specific parameters
    if (body.max && isNaN(Number(body.max))) {
      return ResponseUtil.error("max must be a number", 400);
    }
    if (body.lim && isNaN(Number(body.lim))) {
      return ResponseUtil.error("lim must be a number", 400);
    }
    if (body.dec !== undefined && isNaN(Number(body.dec))) {
      return ResponseUtil.error("dec must be a number", 400);
    }

    // Optional field validations
    if (body.x && !/^[a-zA-Z0-9_]{1,15}$/.test(body.x)) {
      return ResponseUtil.error("Invalid x username", 400);
    }
    if (body.web && !/^https?:\/\/[^\s/$.?#].[^\s]*$/.test(body.web)) {
      return ResponseUtil.error("Invalid website URL", 400);
    }
    if (body.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(body.email)) {
      return ResponseUtil.error("Invalid email address", 400);
    }
  }

  private static async validateMint(body: InputData): Promise<void | TXError> {
    if (!body.amt || isNaN(Number(body.amt))) {
      return ResponseUtil.error("amt is required for mint operation", 400);
    }

    const mintInfo = await this.checkMintedOut(body.tick, body.amt.toString());
    if (mintInfo.minted_out) {
      return ResponseUtil.error(`Token ${body.tick} already minted out`, 400);
    }
  }

  private static async validateTransfer(body: InputData): Promise<void | TXError> {
    if (!body.fromAddress || !isValidBitcoinAddress(body.fromAddress)) {
      return ResponseUtil.error("Invalid or missing fromAddress", 400);
    }
    if (!body.amt || isNaN(Number(body.amt))) {
      return ResponseUtil.error("amt is required for transfer operation", 400);
    }

    const hasBalance = await this.checkEnoughBalance(
      body.fromAddress,
      body.tick,
      body.amt.toString(),
    );
    if (!hasBalance) {
      return ResponseUtil.error("Insufficient balance", 400);
    }
  }
}
