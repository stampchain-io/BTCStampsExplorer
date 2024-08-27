import { Src20Service } from "$lib/services/src20Service.ts";
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
      return await Src20Service.getTotalCountValidSrc20Tx({ tick, op });
    } catch (error) {
      console.error("Error getting total valid SRC20 transactions:", error);
      throw error;
    }
  }

  static async handleSrc20TransactionsRequest(
    _req: Request,
    params: SRC20TrxRequestParams,
  ) {
    try {
      return await Src20Service.fetchAndFormatSrc20Data(params);
    } catch (error) {
      console.error("Error processing SRC20 transaction request:", error);
      throw error;
    }
  }

  static async handleAllSrc20DataForTickRequest(tick: string) {
    try {
      return await Src20Service.fetchAllSrc20DataForTick(tick);
    } catch (error) {
      console.error("Error processing all SRC20 data request for tick:", error);
      throw error;
    }
  }

  static async handleSrc20BalanceRequest(params: SRC20BalanceRequestParams) {
    try {
      return await Src20Service.fetchSrc20Balance(params);
    } catch (error) {
      console.error("Error processing SRC20 balance request:", error);
      console.error("Params:", JSON.stringify(params));
      throw error;
    }
  }

  static async handleSrc20SnapshotRequest(params: SRC20SnapshotRequestParams) {
    try {
      return await Src20Service.fetchAndFormatSrc20Snapshot(params);
    } catch (error) {
      console.error("Error processing SRC20 snapshot request:", error);
      throw error;
    }
  }

  static async handleSrc20MintProgressRequest(tick: string) {
    try {
      const responseBody = await Src20Service.getSrc20MintProgressByTick(tick);
      if (responseBody === null) {
        throw new Error("SRC20 mint progress not found");
      }
      return responseBody;
    } catch (error) {
      console.error("Error processing SRC20 mint progress request:", error);
      throw error;
    }
  }

  static async handleCheckMintedOut(tick: string, amount: string) {
    try {
      return await Src20Service.checkMintedOut(tick, amount);
    } catch (error) {
      console.error("Error checking minted out status:", error);
      throw error;
    }
  }

  static async handleWalletBalanceRequest(
    address: string,
    limit = 50,
    page = 1,
  ) {
    try {
      const subLimit = Math.ceil(limit / 2);
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
        ? src20Response.value
        : { data: [], last_block: 0 };
      const lastBlockData = lastBlock.status === "fulfilled"
        ? lastBlock.value
        : null;

      const stampsTotal = stampsData.total || 0;
      const src20Total = src20Data.data.length;
      const totalItems = stampsTotal + src20Total;
      const totalPages = Math.ceil(totalItems / limit);

      return {
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
      };
    } catch (error) {
      console.error("Error processing wallet balance request:", error);
      throw error;
    }
  }
}
