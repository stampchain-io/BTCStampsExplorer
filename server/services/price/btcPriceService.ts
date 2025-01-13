import { CachedQuicknodeRPCService } from "$server/services/quicknode/cachedQuicknodeRpcService.ts";
import { dbManager } from "$server/database/databaseManager.ts";
import { COINGECKO_API_BASE_URL } from "$lib/utils/constants.ts";

interface QuickNodePrice {
  bitcoin: {
    usd: number;
    usd_market_cap: number;
    usd_24h_vol: number;
    usd_24h_change: number;
  };
}

interface CoinGeckoPrice {
  price: number;
}

interface PriceResult {
  price?: QuickNodePrice | CoinGeckoPrice;
  source?: PriceSource;
  error?: string;
}

type PriceSource = "quicknode" | "coingecko";

export class BTCPriceService {
  private static readonly CACHE_DURATION = 1000 * 60 * 5; // 5 minutes
  private static readonly DEFAULT_SOURCE: PriceSource = "quicknode";
  private static readonly FALLBACK_MAP: Record<PriceSource, PriceSource> = {
    quicknode: "coingecko",
    coingecko: "coingecko", // temporarily disable fallback to quicknode
  };

  static async getPrice(
    source: PriceSource = this.DEFAULT_SOURCE,
    attempted: PriceSource[] = []
  ): Promise<PriceResult> {
    // Force source to be coingecko regardless of what's passed in
    source = "coingecko";
    
    const CACHE_KEY = `btc_price_${source}`;

    try {
      const price = await dbManager.handleCache<QuickNodePrice | CoinGeckoPrice>(
        CACHE_KEY,
        async () => {
          return await this.getCoingeckoPrice();
        },
        this.CACHE_DURATION,
      );

      return { price, source: "coingecko" };
    } catch (error) {
      console.error(`Error fetching BTC price from ${source}:`, error);
      
      // Simplify fallback logic to only retry coingecko once
      if (!attempted.length) {
        console.log('Retrying coingecko');
        return this.getPrice("coingecko", ["coingecko"]);
      }

      return { error: "CoinGecko price fetch failed" };
    }
  }

  private static async getQuicknodePrice(): Promise<QuickNodePrice> {
    try {
      const params = ["bitcoin", "usd", true, true, true];
      const response = await CachedQuicknodeRPCService.executeRPC<QuickNodePrice>(
        "cg_simplePrice",
        params
      );

      if ("error" in response) {
        console.error("QuickNode price error:", response.error);
        throw new Error(response.error);
      }
      console.log("QuickNode price result:", response.result);
      return response.result;
    } catch (error) {
      console.error("QuickNode price fetch failed:", error);
      throw error;
    }
  }

  private static async getCoingeckoPrice(): Promise<CoinGeckoPrice> {
    try {
      const response = await fetch(
        `${COINGECKO_API_BASE_URL}/simple/price?ids=bitcoin&vs_currencies=usd`
      );
      if (!response.ok) {
        console.error(`CoinGecko API error: ${response.status} ${response.statusText}`);
        throw new Error(`CoinGecko API returned ${response.status}`);
      }
      const data = await response.json();
      console.log("CoinGecko price data:", data);
      return { price: data.bitcoin.usd };
    } catch (error) {
      console.error("CoinGecko price fetch failed:", error);
      throw error;
    }
  }
}

