import { Src20Service } from "$lib/services/src20Service.ts";
import { ResponseUtil } from "utils/responseUtil.ts";
import {
  SRC20BalanceRequestParams,
  SRC20SnapshotRequestParams,
  SRC20TrxRequestParams,
} from "globals";
import { BIG_LIMIT } from "utils/constants.ts";

export class Src20Controller {
  static async getSrc20s(page = 1, page_size = BIG_LIMIT) {
    try {
      const result = await Src20Service.getSrc20s(page, page_size);
      return ResponseUtil.success(result);
    } catch (error) {
      console.error("Error in Src20Controller.getSrc20s:", error);
      return ResponseUtil.error("Error fetching SRC20s");
    }
  }

  static async handleSrc20TransactionsRequest(
    req: Request,
    params: Partial<SRC20TrxRequestParams>,
  ) {
    try {
      const url = new URL(req.url);
      const finalParams: SRC20TrxRequestParams = {
        ...params,
        op: url.searchParams.get("op"),
        limit: Number(url.searchParams.get("limit")) || BIG_LIMIT,
        page: Number(url.searchParams.get("page")) || 1,
        sort: url.searchParams.get("sort") || "ASC",
      };

      const responseBody = await Src20Service.fetchAndFormatSrc20Transactions(
        finalParams,
      );
      return ResponseUtil.success(responseBody);
    } catch (error) {
      console.error("Error processing SRC20 transactions request:", error);
      if (error.message === "Stamps Down...") {
        return ResponseUtil.error("Service temporarily unavailable", 503);
      }
      return ResponseUtil.error(
        `Error: Internal server error. ${error.message || ""}`,
        500,
      );
    }
  }

  static async handleSrc20BalanceRequest(params: SRC20BalanceRequestParams) {
    try {
      const responseBody = await Src20Service.fetchAndFormatSrc20Balance(
        params,
      );
      return ResponseUtil.success(responseBody);
    } catch (error) {
      console.error("Error processing SRC20 balance request:", error);
      if (error.message === "SRC20 balance not found") {
        return ResponseUtil.error("Error: SRC20 balance not found", 404);
      }
      return ResponseUtil.error(
        `Error: Internal server error. ${error.message || ""}`,
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
}
