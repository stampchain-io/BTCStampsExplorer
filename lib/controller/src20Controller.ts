import { Src20Service } from "$lib/services/src20Service.ts";
import { ResponseUtil } from "utils/responseUtil.ts";
import {
  SRC20BalanceRequestParams,
  SRC20SnapshotRequestParams,
  SRC20TrxRequestParams,
} from "globals";
import { StampService } from "$lib/services/stampService.ts";
import { getBtcAddressInfo } from "utils/btc.ts";
import { BlockService } from "$lib/services/blockService.ts";

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

  static async handleAllSrc20DataForTickRequest(tick: string) {
    try {
      const allData = await Src20Service.fetchAllSrc20DataForTick(tick);
      return ResponseUtil.success(allData);
    } catch (error) {
      console.error("Error processing all SRC20 data request for tick:", error);
      return ResponseUtil.error(
        `Error: Internal server error. ${error.message || ""}`,
        500,
      );
    }
  }

  static async handleSrc20BalanceRequest(params: SRC20BalanceRequestParams) {
    try {
      const responseBody = await Src20Service.fetchSrc20Balance(params);
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
    // TODO: revise this to query SRC20Valid for prior block balances
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
      const subLimit = Math.ceil(limit / 2); // Split the limit between stamps and src20
      const [btcInfo, stampsResponse, src20Response, lastBlock] = await Promise
        .allSettled([
          getBtcAddressInfo(address),
          StampService.getStampBalancesByAddress(address, subLimit, page),
          this.handleSrc20BalanceRequest({
            address,
            limit: subLimit,
            page,
            sort: "ASC",
          }),
          BlockService.getLastBlock(),
        ]);

      const btcData = btcInfo.status === "fulfilled" ? btcInfo.value : null;
      const stampsData = stampsResponse.status === "fulfilled"
        ? stampsResponse.value
        : { stamps: [], total: 0 };
      const src20Data = src20Response.status === "fulfilled"
        ? await src20Response.value.json()
        : { data: [], last_block: 0 };
      const lastBlockData = lastBlock.status === "fulfilled"
        ? lastBlock.value
        : null;

      const stampsTotal = stampsData.total || 0;
      const src20Total = src20Data.data.length;
      const totalItems = stampsTotal + src20Total;
      const totalPages = Math.ceil(totalItems / limit);

      return ResponseUtil.success({
        btc: btcData,
        data: {
          stamps: stampsData.stamps,
          src20: src20Data.data,
        },
        pagination: {
          page,
          limit,
          total: totalItems,
          totalPages,
        },
        last_block: src20Data.last_block || lastBlockData?.last_block || 0,
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
