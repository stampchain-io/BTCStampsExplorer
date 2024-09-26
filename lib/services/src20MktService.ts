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

export class Src20MktService {
  static async fetchMarketListingSummary(): Promise<MarketListingSummary[]> {
    const response = await fetch(
      "https://api.stampscan.xyz/market/listingSummary",
    );
    if (!response.ok) {
      throw new Error("Failed to fetch market listing summary");
    }
    return await response.json();
  }
}
