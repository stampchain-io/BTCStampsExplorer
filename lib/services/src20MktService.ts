import { serverConfig } from "$server/config/config.ts";

export interface MarketListingSummary {
  tick: string;
  floor_unit_price: number;
  mcap: number;
  sum_7d: number | null;
  sum_3d: number | null;
  sum_1d: number | null;
  stamp_url: string | null;
  tx_hash: string;
  holder_count: number;
}

interface OpenStampMarketData {
  name: string;
  price: number; // in satoshis
  totalSupply: number;
}

const OPENSTAMP_API_KEY = serverConfig.OPENSTAMP_API_KEY;

export class Src20MktService {
  static async fetchMarketListingSummary(): Promise<MarketListingSummary[]> {
    const [stampscanData, openStampData] = await Promise.all([
      this.fetchStampScanMarketData().catch(() => []),
      this.fetchOpenStampMarketData().catch(() => []),
    ]);

    const openStampDataMap = new Map<string, OpenStampMarketData>(
      openStampData.map((item) => [item.name.toUpperCase(), item]),
    );

    return stampscanData.map((item) => {
      const openStampItem = openStampDataMap.get(item.tick.toUpperCase());
      const floor_unit_price = openStampItem
        ? Math.min(item.floor_unit_price, openStampItem.price / 1e8) // Convert satoshis to BTC to match stampscan floor_unit_price
        : item.floor_unit_price;
      const totalSupply = openStampItem?.totalSupply;
      const mcap = totalSupply !== undefined
        ? Number(floor_unit_price) * totalSupply // Ensure floor_unit_price is treated as a number
        : item.mcap; // Use stampscan.mcap if totalSupply is not defined

      return {
        ...item,
        floor_unit_price,
        mcap,
      };
    });
  }

  private static async fetchStampScanMarketData(): Promise<
    MarketListingSummary[]
  > {
    const response = await fetch(
      "https://api.stampscan.xyz/market/listingSummary",
    );
    if (!response.ok) {
      throw new Error("Failed to fetch market listing summary from StampScan");
    }
    return await response.json();
  }

  private static async fetchOpenStampMarketData(): Promise<
    OpenStampMarketData[]
  > {
    const response = await fetch(
      "https://openapi.openstamp.io/v1/src20MarketData",
      {
        headers: {
          ...(OPENSTAMP_API_KEY && { Authorization: OPENSTAMP_API_KEY }),
        },
      },
    );
    if (!response.ok) {
      throw new Error("Failed to fetch market data from OpenStamp");
    }
    const data = await response.json();
    return data.data;
  }
}
