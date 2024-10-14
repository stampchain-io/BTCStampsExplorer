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

export interface OpenStampMarketData {
  name: string;
  price: number; // in satoshis
  totalSupply: number;
}
