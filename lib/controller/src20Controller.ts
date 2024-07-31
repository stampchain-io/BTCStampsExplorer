import { Src20Service } from "$lib/services/src20Service.ts";
import { ResponseUtil } from "utils/responseUtil.ts";
import {
  SRC20BalanceRequestParams,
  SRC20SnapshotRequestParams,
  SRC20TrxRequestParams,
} from "globals";
import { StampService } from "$lib/services/stampService.ts";
import { getBtcAddressInfo } from "utils/btc.ts";

export class Src20Controller {
  static async getTotalCountValidSrc20Tx(tick?: string, op?: string) {
    try {
      const total = await Src20Service.getTotalCountValidSrc20Tx({ tick, op });
      return ResponseUtil.success({ total });
    } catch (error) {
      console.error("Error getting total valid SRC20 transactions:", error);
      return ResponseUtil.error("Error getting total valid SRC20 transactions");
    }
  }

  static async handleSrc20TransactionsRequest(
    _req: Request,
    params: SRC20TrxRequestParams,
  ): Promise<Response> {
    try {
      const src20Data = await Src20Service.fetchAndFormatSrc20Data(params);
      return ResponseUtil.success(src20Data);
    } catch (error) {
      console.error("Error processing SRC20 transaction request:", error);
      return ResponseUtil.error(
        `Error: Internal server error. ${error.message || ""}`,
        500,
      );
    }
  }

  static async handleSrc20BalanceRequest(params: SRC20BalanceRequestParams) {
    try {
      let responseBody;
      if (params.address && params.tick) {
        responseBody = await Src20Service.fetchSingleSrc20Balance(
          params.address,
          params.tick,
        );
      } else {
        responseBody = await Src20Service.fetchAndFormatSrc20Balance(params);
      }
      return ResponseUtil.success(responseBody);
    } catch (error) {
      console.error("Error processing SRC20 balance request:", error);
      console.error("Params:", JSON.stringify(params));
      if (error.message === "SRC20 balance not found") {
        return ResponseUtil.error("Error: SRC20 balance not found", 404);
      }
      return ResponseUtil.error(
        `Error: Internal server error. ${error.message || ""}`,
        500,
      );
    }
  }

  static async handleSrc20SnapshotRequest(params: SRC20SnapshotRequestParams) {
    try {
      const responseBody = await Src20Service.fetchAndFormatSrc20Snapshot(
        params,
      );
      return ResponseUtil.success(responseBody);
    } catch (error) {
      console.error("Error processing SRC20 snapshot request:", error);
      return ResponseUtil.error(
        `Error: Internal server error. ${error.message || ""}`,
        500,
      );
    }
  }

  static async handleSrc20MintProgressRequest(tick: string) {
    try {
      const responseBody = await Src20Service.getSrc20MintProgressByTick(tick);
      if (responseBody === null) {
        return ResponseUtil.error("Error: SRC20 mint progress not found", 404);
      }
      return ResponseUtil.success(responseBody);
    } catch (error) {
      console.error("Error processing SRC20 mint progress request:", error);
      return ResponseUtil.error(
        `Error: Internal server error. ${error.message || ""}`,
      );
    }
  }

  static async handleCheckMintedOut(tick: string, amount: string) {
    try {
      const result = await Src20Service.checkMintedOut(tick, amount);
      return ResponseUtil.success(result);
    } catch (error) {
      console.error("Error checking minted out status:", error);
      return ResponseUtil.error(`Error: ${error.message}`, 500);
    }
  }

  static async handleWalletBalanceRequest(
    address: string,
    limit = 50,
    page = 1,
  ) {
    try {
      const btcInfo = await getBtcAddressInfo(address);
      const stampsResponse = await StampService.getStampBalancesByAddress(
        address,
        limit,
        page,
      );
      const src20Response = await this.handleSrc20BalanceRequest({
        address,
        limit,
        page,
        sort: "ASC",
      });

      const src20Data = await src20Response.json();

      return ResponseUtil.success({
        btc: btcInfo,
        data: {
          stamps: stampsResponse.data,
          src20: src20Data.data,
        },
      });
    } catch (error) {
      console.error("Error processing wallet balance request:", error);
      return ResponseUtil.error(
        `Error: Internal server error. ${error.message || ""}`,
        500,
      );
    }
  }
}
