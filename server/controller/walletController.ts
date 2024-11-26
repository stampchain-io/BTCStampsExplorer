import { StampController } from "./stampController.ts";
import { BlockService } from "$server/services/blockService.ts";
import { getAddressInfo } from "$lib/utils/balanceUtils.ts";
import { serverConfig } from "$server/config/config.ts";
import { WalletData } from "$lib/types/index.d.ts";
import { Src20Controller } from "./src20Controller.ts";

export class WalletController {
  static async handleWalletBalanceRequest(
    address: string,
    limit = 50,
    page = 1,
  ) {
    try {
      const subLimit = Math.ceil(limit / 2);

      const [
        btcInfo,
        stampsResponse,
        src20Response,
        lastBlock,
      ] = await Promise.allSettled([
        getAddressInfo(address, { 
          includeUSD: true,
          apiBaseUrl: serverConfig.API_BASE_URL 
        }),
        StampController.getStampBalancesByAddress(address, subLimit, page),
        Src20Controller.handleSrc20BalanceRequest({
          address,
          limit: subLimit,
          page,
          sortBy: "ASC",
        }),
        BlockService.getLastBlock(),
      ]);

      const btcData = btcInfo.status === "fulfilled" ? btcInfo.value : null;
      const stampsData = stampsResponse.status === "fulfilled"
        ? stampsResponse.value
        : { data: [], total: 0 };
      const src20Data = src20Response.status === "fulfilled"
        ? src20Response.value
        : { data: [], last_block: 0 };
      const lastBlockData = lastBlock.status === "fulfilled"
        ? lastBlock.value
        : null;

      const stampsTotal = stampsData.total || 0;
      const src20Total = Array.isArray(src20Data.data)
        ? src20Data.data.length
        : 0;
      const totalItems = stampsTotal + src20Total;
      const totalPages = Math.ceil(totalItems / limit);

      const walletData: WalletData = {
        balance: btcData?.balance ?? 0,
        usdValue: btcData?.usdValue ?? 0,
        address,
        btcPrice: btcData?.btcPrice ?? 0,
        txCount: btcData?.txCount ?? 0,
        unconfirmedBalance: btcData?.unconfirmedBalance ?? 0,
        unconfirmedTxCount: btcData?.unconfirmedTxCount ?? 0
      };

      return {
        btc: walletData,
        data: {
          stamps: stampsData.data,
          src20: Array.isArray(src20Data.data) ? src20Data.data : [],
        },
        pagination: {
          page,
          limit,
          total: totalItems,
          totalPages,
        },
        last_block: stampsData.last_block || src20Data.last_block || lastBlockData?.last_block || 0,
      };
    } catch (error) {
      console.error("Error processing wallet balance request:", error);
      throw error;
    }
  }
} 