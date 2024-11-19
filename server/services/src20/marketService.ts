import { serverConfig } from "$server/config/config.ts";
import { MarketListingSummary, OpenStampMarketData } from "$types/index.d.ts";

const OPENSTAMP_API_KEY = serverConfig.OPENSTAMP_API_KEY;

// Rename from Src20MktService to SRC20MarketService to match convention
export class SRC20MarketService {
  static async fetchMarketListingSummary(): Promise<MarketListingSummary[]> {
    const [stampscanData, openStampData] = await Promise.all([
      this.fetchStampScanMarketData().catch(() => []),
      this.fetchOpenStampMarketData().catch(() => []),
    ]);

    const openStampDataMap = new Map<string, OpenStampMarketData>(
      Array.isArray(openStampData)
        ? openStampData.map((item) => [item.name.toUpperCase(), item])
        : [],
    );

    return stampscanData.map((item) => {
      const openStampItem = openStampDataMap.get(item.tick.toUpperCase());
      const floor_unit_price = openStampItem
        ? Math.min(item.floor_unit_price, openStampItem.price / 1e8)
        : item.floor_unit_price;
      const totalSupply = openStampItem?.totalSupply;
      const mcap = totalSupply !== undefined
        ? Number(floor_unit_price) * totalSupply
        : item.mcap;

      return {
        ...item,
        floor_unit_price,
        mcap,
      };
    });
  }

  private static async fetchStampScanMarketData(): Promise<MarketListingSummary[]> {
    const response = await fetch("https://api.stampscan.xyz/market/listingSummary");
    if (!response.ok) {
      throw new Error("Failed to fetch market listing summary from StampScan");
    }
    return await response.json();
  }

  private static async fetchOpenStampMarketData(): Promise<OpenStampMarketData[]> {
    const response = await fetch("https://openapi.openstamp.io/v1/src20MarketData", {
      headers: {
        ...(OPENSTAMP_API_KEY && { Authorization: OPENSTAMP_API_KEY }),
      },
    });
    if (!response.ok) {
      throw new Error("Failed to fetch market data from OpenStamp");
    }
    const data = await response.json();
    return data.data;
  }
}
