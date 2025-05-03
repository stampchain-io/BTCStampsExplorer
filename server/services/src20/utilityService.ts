import { unicodeEscapeToEmoji } from "$lib/utils/emojiUtils.ts";
import { Src20Detail, InputData } from "$globals";
import { crypto } from "@std/crypto";
import { isValidBitcoinAddress } from "$lib/utils/utxoUtils.ts";
import { SRC20QueryService } from "./queryService.ts";
import { BigFloat } from "bigfloat/mod.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import type { IDeploySRC20, IMintSRC20, ITransferSRC20 } from "$types/index.d.ts";
import { InputData } from "$server/types/index.d.ts";
import { logger } from "$lib/utils/logger.ts";
import { ToastUtil } from "$islands/Toast/toastUtils.ts";
import { MessageUtil } from "$islands/Toast/messageUtils.ts";

export class SRC20UtilityService {
  static formatSRC20Row(row: Src20Detail) {
    return {
      ...row,
      tick: unicodeEscapeToEmoji(row.tick),
      max: row.max ? row.max.toString() : null,
      lim: row.lim ? row.lim.toString() : null,
      amt: row.amt ? row.amt.toString() : null,
    };
  }

  static calculateTickHash(tick: string): string {
    const encoder = new TextEncoder();
    const data = encoder.encode(tick.toLowerCase());
    const hashBuffer = crypto.subtle.digestSync("SHA3-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  static async checkDeployedTick(tick: string) {
    const mintInfo = await SRC20QueryService.fetchSrc20MintProgress(tick);
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

  static async validateOperation(data: any) {
    // Tick validation
    if (!data.tick) {
      return ResponseUtil.badRequest(
        MessageUtil.getValidationMessage("REQUIRED", "TICK")
      );
    }

    // Source address validation
    if (!data.sourceAddress) {
      return ResponseUtil.badRequest(
        MessageUtil.getValidationMessage("REQUIRED", "SOURCE_ADDRESS")
      );
    }

    // Deploy-specific validations
    if (data.op === "DEPLOY") {
      if (!data.maxSupply) {
        return ResponseUtil.badRequest(
          MessageUtil.getValidationMessage("REQUIRED", "MAX_SUPPLY")
        );
      }
      if (!data.limitPerMint) {
        return ResponseUtil.badRequest(
          MessageUtil.getValidationMessage("REQUIRED", "LIMIT_PER_MINT")
        );
      }
      if (data.decimals === undefined) {
        return ResponseUtil.badRequest(
          MessageUtil.getValidationMessage("REQUIRED", "DECIMALS")
        );
      }
    }

    // Mint/Transfer amount validation
    if (["MINT", "TRANSFER"].includes(data.op) && !data.amount) {
      return ResponseUtil.badRequest(
        MessageUtil.getValidationMessage("REQUIRED", "AMOUNT")
      );
    }

    // Transfer recipient validation
    if (data.op === "TRANSFER" && !data.recipientAddress) {
      return ResponseUtil.badRequest(
        MessageUtil.getValidationMessage("REQUIRED", "RECIPIENT_ADDRESS")
      );
    }

    // Balance validation for transfers
    if (data.op === "TRANSFER" && data.balance < data.amount) {
      return ResponseUtil.badRequest(
        MessageUtil.getValidationMessage("INVALID", "BALANCE")
      );
    }

    // URL validation
    if (data.url && !this.isValidUrl(data.url)) {
      return ResponseUtil.badRequest(
        MessageUtil.getValidationMessage("INVALID", "URL")
      );
    }

    // Email validation
    if (data.email && !this.isValidEmail(data.email)) {
      return ResponseUtil.badRequest(
        MessageUtil.getValidationMessage("INVALID", "EMAIL")
      );
    }

    return ResponseUtil.success(true);
  }

  // Helper functions
  private static isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }
}
