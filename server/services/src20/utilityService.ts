import { convertToEmoji } from "$lib/utils/emojiUtils.ts";
import { Src20Detail, InputData } from "globals";
import { crypto } from "@std/crypto";
import { isValidBitcoinAddress } from "$lib/utils/utxoUtils.ts";
import { SRC20QueryService } from "./queryService.ts";
import { BigFloat } from "bigfloat/mod.ts";
import { ResponseUtil } from "$lib/utils/responseUtil.ts";
import type { IDeploySRC20, IMintSRC20, ITransferSRC20 } from "$types/index.d.ts";
import { InputData } from "$server/types/index.d.ts";
import { logger } from "$lib/utils/logger.ts";
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
    const hashBuffer = crypto.subtle.digestSync("SHA3-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
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
    data: InputData,
  ): Promise<Response | null> {
    logger.debug("stamps", {
      message: "Validating operation",
      data: {
        operation,
        ...data,
        isEstimate: data.isEstimate,
      },
    });

    // Basic validation for all operations
    if (!data.sourceAddress) {
      return ResponseUtil.badRequest("Source address is required");
    }

    if (!data.tick) {
      return ResponseUtil.badRequest("Tick is required");
    }

    // Operation-specific validation
    switch (operation) {
      case "deploy":
        return await this.validateDeploy(data);
      case "mint":
        return await this.validateMint(data);
      case "transfer":
        return await this.validateTransfer(data);
      default:
        return ResponseUtil.badRequest("Invalid operation");
    }
  }

  private static async validateDeploy(data: InputData): Promise<Response | null> {
    // Skip deployed check for estimation
    if (!data.isEstimate) {
      const { deployed } = await this.checkDeployedTick(data.tick);
      if (deployed) {
        return ResponseUtil.badRequest(`Token ${data.tick} already deployed`);
      }
    }

    // Required field validations
    if (!data.max) {
      return ResponseUtil.badRequest("Max supply is required for deploy");
    }
    if (!data.lim) {
      return ResponseUtil.badRequest("Limit per mint is required for deploy");
    }
    if (data.dec === undefined) {
      return ResponseUtil.badRequest("Decimals is required for deploy");
    }

    // Validate numeric values
    try {
      const maxValue = BigInt(data.max);
      const limValue = BigInt(data.lim);
      const decValue = parseInt(data.dec);

      if (maxValue <= 0n) {
        return ResponseUtil.badRequest("Max supply must be greater than 0");
      }
      if (limValue <= 0n) {
        return ResponseUtil.badRequest("Limit per mint must be greater than 0");
      }
      if (limValue > maxValue) {
        return ResponseUtil.badRequest("Limit per mint cannot exceed max supply");
      }
      if (decValue < 0 || decValue > 18) {
        return ResponseUtil.badRequest("Decimals must be between 0 and 18");
      }
    } catch (error) {
      return ResponseUtil.badRequest("Invalid numeric values provided");
    }

    // Optional field validations - skip for estimation
    if (!data.isEstimate) {
      if (data.x && !/^[a-zA-Z0-9_]{1,15}$/.test(data.x)) {
        return ResponseUtil.badRequest("Invalid x username");
      }
      if (data.web && !/^https?:\/\/[^\s/$.?#].[^\s]*$/.test(data.web)) {
        return ResponseUtil.badRequest("Invalid website URL");
      }
      if (data.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(data.email)) {
        return ResponseUtil.badRequest("Invalid email address");
      }
    }

    return null;
  }

  private static async validateMint(data: InputData): Promise<Response | null> {
    if (!data.amt) {
      return ResponseUtil.badRequest("Amount is required for mint");
    }

    // Skip minted out check for estimation
    if (!data.isEstimate) {
      const mintInfo = await this.checkMintedOut(data.tick, data.amt);
      if (mintInfo.minted_out) {
        return ResponseUtil.badRequest(`Token ${data.tick} already minted out`);
      }
    }

    return null;
  }

  private static async validateTransfer(data: InputData): Promise<Response | null> {
    if (!data.toAddress || !isValidBitcoinAddress(data.toAddress)) {
      return ResponseUtil.badRequest("Invalid or missing recipient address");
    }
    if (!data.amt) {
      return ResponseUtil.badRequest("Amount is required for transfer");
    }

    // Skip balance check for estimation
    if (!data.isEstimate) {
      const hasBalance = await this.checkEnoughBalance(
        data.sourceAddress,
        data.tick,
        data.amt,
      );
      if (!hasBalance) {
        return ResponseUtil.badRequest("Insufficient balance");
      }
    }

    return null;
  }
}
