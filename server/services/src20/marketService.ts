import { serverConfig } from "$server/config/config.ts";
import { MarketListingAggregated, OpenStampMarketData, StampScanMarketData } from "$lib/types/marketData.d.ts";

const OPENSTAMP_API_KEY = serverConfig.OPENSTAMP_API_KEY;

export class SRC20MarketService {
  static async fetchMarketListingSummary(): Promise<MarketListingAggregated[]> {
    // Fetch data from both sources
    const [stampScanData, openStampData] = await Promise.all([
      this.fetchStampScanMarketData().catch(() => [] as StampScanMarketData[]),
      this.fetchOpenStampMarketData().catch(() => [] as OpenStampMarketData[]),
    ]);

    const stampScanMap = new Map<string, StampScanMarketData>(
      stampScanData.map((item) => [item.tick.toUpperCase(), item])
    );

    const openStampMap = new Map<string, OpenStampMarketData>(
      openStampData.map((item) => [item.name.toUpperCase(), item])
    );

    const allTicks = new Set([
      ...Array.from(stampScanMap.keys()),
      ...Array.from(openStampMap.keys()),
    ]);

    // Aggregate data for each unique tick
    return Array.from(allTicks).map((tick) => {
      const stampScanItem = stampScanMap.get(tick);
      const openStampItem = openStampMap.get(tick);

      // Calculate floor price (lower of stampscan and openstamp)
      const stampScanPrice = stampScanItem?.floor_unit_price ?? Infinity;
      const openStampPrice = openStampItem ? Number(openStampItem.price) / 1e8 : Infinity;
      const floor_unit_price = Math.min(stampScanPrice, openStampPrice);

      // Calculate market cap using the lower price
      const totalSupply = openStampItem?.totalSupply ?? 0;
      const mcap = floor_unit_price * totalSupply;

      // Calculate combined 24h volume
      const stampScanVolume = stampScanItem?.sum_1d ?? 0;
      const openStampVolume = openStampItem ? Number(openStampItem.volume24) / 1e8 : 0;
      const volume24 = stampScanVolume + openStampVolume;

      // Use StampScan data as primary source for metadata
      const metadata = {
        stamp_url: stampScanItem?.stamp_url ?? null,
        tx_hash: stampScanItem?.tx_hash ?? "",
        holder_count: stampScanItem?.holder_count ?? (openStampItem?.holdersCount ?? 0),
      };

      return {
        tick, // emoji tick
        floor_unit_price,
        mcap,
        volume24,
        ...metadata,
        market_data: {
          stampscan: {
            price: stampScanPrice === Infinity ? 0 : stampScanPrice,
            volume24: stampScanVolume,
          },
          openstamp: {
            price: openStampPrice === Infinity ? 0 : openStampPrice,
            volume24: openStampVolume,
          },
        },
      };
    });
  }

  private static async fetchStampScanMarketData(): Promise<StampScanMarketData[]> {
    const response = await fetch("https://api.stampscan.xyz/market/listingSummary");
    if (!response.ok) {
      throw new Error("Failed to fetch market listing summary from StampScan");
    }
    const data = await response.json();
    return data;
  }

  private static async fetchOpenStampMarketData(): Promise<OpenStampMarketData[]> {
    try {
      const response = await fetch("https://openapi.openstamp.io/v1/src20MarketData", {
        headers: {
          ...(OPENSTAMP_API_KEY && { Authorization: OPENSTAMP_API_KEY }),
        },
      });
      if (!response.ok) {
        console.error("HTTP Error:", response.status, response.statusText);
        return [];
      }
      
      const data = await response.json();

      // Ensure `data.data` is an array, otherwise return an empty array
      if (Array.isArray(data.data)) {
        return data.data;
      } else {
        console.warn("Unexpected data format: data.data is not an array");
        return [];
      }
    } catch (error) {
      console.error("Fetch Error:", error.message);
      return [];
    }
  }
}
