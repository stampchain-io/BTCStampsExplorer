import { serverConfig } from "$server/config/config.ts";
import { MarketListingAggregated, OpenStampMarketData, StampScanMarketData } from "$lib/types/marketData.d.ts";

const OPENSTAMP_API_KEY = serverConfig.OPENSTAMP_API_KEY;

export class SRC20MarketService {
  static async fetchMarketListingSummary(): Promise<MarketListingAggregated[]> {
    console.log("[SRC20MarketService] Starting fetchMarketListingSummary");

    // Fetch data from both sources
    console.log("[SRC20MarketService] Fetching StampScan market data...");
    const stampScanDataPromise = this.fetchStampScanMarketData()
      .then(data => {
        console.log("[SRC20MarketService] Successfully fetched StampScan data:", JSON.stringify(data, null, 2).substring(0, 500) + "..."); // Log snippet
        return data;
      })
      .catch(error => {
        console.error("[SRC20MarketService] Error fetching StampScan market data:", error);
        return [] as StampScanMarketData[];
      });

    console.log("[SRC20MarketService] Fetching OpenStamp market data...");
    const openStampDataPromise = this.fetchOpenStampMarketData()
      .then(data => {
        console.log("[SRC20MarketService] Successfully fetched OpenStamp data:", JSON.stringify(data, null, 2).substring(0, 500) + "..."); // Log snippet
        return data;
      })
      .catch(error => {
        console.error("[SRC20MarketService] Error fetching OpenStamp market data:", error);
        return [] as OpenStampMarketData[];
      });

    const [stampScanData, openStampData] = await Promise.all([
      stampScanDataPromise,
      openStampDataPromise,
    ]);

    console.log(`[SRC20MarketService] Received ${stampScanData.length} items from StampScan.`);
    console.log(`[SRC20MarketService] Received ${openStampData.length} items from OpenStamp.`);

    const stampScanMap = new Map<string, StampScanMarketData>(
      stampScanData.map((item) => {
        const tickKey = item.tick?.toUpperCase();
        if (!tickKey) console.warn("[SRC20MarketService] StampScan item missing tick:", item);
        return [tickKey || "MISSING_TICK_" + Math.random(), item];
      })
    );

    const openStampMap = new Map<string, OpenStampMarketData>(
      openStampData.map((item) => {
        const nameKey = item.name?.toUpperCase();
        if (!nameKey) console.warn("[SRC20MarketService] OpenStamp item missing name:", item);
        return [nameKey || "MISSING_NAME_" + Math.random(), item];
      })
    );

    const allTicks = new Set([
      ...Array.from(stampScanMap.keys()),
      ...Array.from(openStampMap.keys()),
    ]);

    // Aggregate data for each unique tick
    return Array.from(allTicks).map((tick) => {
      console.log(`[SRC20MarketService] Processing aggregated data for tick: ${tick}`);
      const stampScanItem = stampScanMap.get(tick);
      const openStampItem = openStampMap.get(tick);

      if (!stampScanItem) console.log(`[SRC20MarketService] No StampScan data for tick: ${tick}`);
      if (!openStampItem) console.log(`[SRC20MarketService] No OpenStamp data for tick: ${tick}`);

      // Calculate floor price (lower of stampscan and openstamp)
      const stampScanPrice = stampScanItem?.floor_unit_price ?? Infinity;
      const openStampPrice = openStampItem && openStampItem.price ? Number(openStampItem.price) / 1e8 : Infinity; // Added check for openStampItem.price
      const floor_unit_price = Math.min(stampScanPrice, openStampPrice);
      
      console.log(`[SRC20MarketService] Tick: ${tick}, StampScanPrice: ${stampScanPrice}, OpenStampPrice: ${openStampPrice}, FloorPrice: ${floor_unit_price}`);

      // Calculate market cap using the lower price
      const totalSupply = openStampItem?.totalSupply ?? 0;
      const mcap = (floor_unit_price !== Infinity && totalSupply > 0) ? floor_unit_price * totalSupply : 0; // Avoid Infinity * 0 or Infinity * number
      console.log(`[SRC20MarketService] Tick: ${tick}, TotalSupply: ${totalSupply}, Mcap: ${mcap}`);

      // Calculate combined 24h volume
      const stampScanVolume = stampScanItem?.sum_1d ?? 0;
      const openStampVolume = openStampItem ? Number(openStampItem.volume24) / 1e8 : 0;
      const volume24 = stampScanVolume + openStampVolume;

      // Extract and parse change24 from OpenStamp data
      const change24Raw = openStampItem?.change24;
      let change24: number | undefined = undefined;
      if (change24Raw) {
        try {
          change24 = parseFloat(change24Raw.replace("%", ""));
          if (isNaN(change24)) {
            change24 = undefined;
            console.warn(`[SRC20MarketService] Could not parse change24 value '${change24Raw}' for tick ${tick} to a number.`);
          }
        } catch (e) {
          change24 = undefined;
          console.warn(`[SRC20MarketService] Error parsing change24 value '${change24Raw}' for tick ${tick}:`, e);
        }
      }

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
        change24,
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
    console.log("[SRC20MarketService] Attempting to fetch from StampScan: https://api.stampscan.xyz/market/listingSummary");
    const response = await fetch("https://api.stampscan.xyz/market/listingSummary");
    console.log(`[SRC20MarketService] StampScan response status: ${response.status}`);
    if (!response.ok) {
      const errorText = await response.text().catch(() => "Could not read error response text");
      console.error(`[SRC20MarketService] Failed to fetch market listing summary from StampScan. Status: ${response.status}, Text: ${errorText}`);
      throw new Error(`Failed to fetch market listing summary from StampScan. Status: ${response.status}`);
    }
    const rawData = await response.text();
    console.log("[SRC20MarketService] StampScan raw response:", rawData.substring(0, 500) + "..."); // Log snippet
    try {
      const data = JSON.parse(rawData);
      return Array.isArray(data) ? data : (data?.data && Array.isArray(data.data) ? data.data : []); // Handle potential variations in response structure
    } catch (e) {
      console.error("[SRC20MarketService] Error parsing StampScan JSON:", e, "Raw data:", rawData.substring(0, 500) + "...");
      throw new Error("Error parsing StampScan JSON");
    }
  }

  private static async fetchOpenStampMarketData(): Promise<OpenStampMarketData[]> {
    const url = "https://openapi.openstamp.io/v1/src20MarketData";
    console.log(`[SRC20MarketService] Attempting to fetch from OpenStamp: ${url}`);
    try {
      const headers: Record<string, string> = {};
      if (OPENSTAMP_API_KEY) {
        headers["Authorization"] = OPENSTAMP_API_KEY;
        console.log("[SRC20MarketService] Using OpenStamp API Key");
      } else {
        console.warn("[SRC20MarketService] OPENSTAMP_API_KEY is not set. OpenStamp API might fail or return limited data.");
      }

      const response = await fetch(url, { headers });
      console.log(`[SRC20MarketService] OpenStamp response status: ${response.status}`);

      if (!response.ok) {
        const errorText = await response.text().catch(() => "Could not read error response text");
        console.error(`[SRC20MarketService] HTTP Error fetching from OpenStamp: ${response.status} ${response.statusText}. Text: ${errorText}`);
        return [];
      }
      
      const rawData = await response.text();
      console.log("[SRC20MarketService] OpenStamp raw response:", rawData.substring(0, 500) + "..."); // Log snippet
      const data = JSON.parse(rawData);

      // Ensure `data.data` is an array, otherwise return an empty array
      if (data && Array.isArray(data.data)) { // Check if data itself is not null/undefined
        console.log(`[SRC20MarketService] OpenStamp returned ${data.data.length} items in data.data`);
        return data.data;
      } else if (Array.isArray(data)) { // Sometimes the root response is an array
         console.log(`[SRC20MarketService] OpenStamp returned ${data.length} items directly in root array`);
         return data;
      }else {
        console.warn("[SRC20MarketService] Unexpected data format from OpenStamp: data.data is not an array or root is not an array. Received:", JSON.stringify(data, null, 2).substring(0,500) + "...");
        return [];
      }
    } catch (error) {
      console.error("[SRC20MarketService] Fetch Error from OpenStamp:", error.message);
      return [];
    }
  }
}
