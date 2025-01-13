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
  tokenId: number;
  name: string; // emoji tick
  totalSupply: number;
  holdersCount: number;
  price: string; // in satoshis
  amount24: string;
  volume24: string; // in satoshis
  volume24Change: string;
  change24: string;
  change7d: string;
}

export interface StampScanMarketData {
  tick: string; // emoji tick
  floor_unit_price: number; // in btc
  mcap: number; // in btc
  sum_7d: number | null; // in btc
  sum_3d: number | null; // in btc
  sum_1d: number | null; // in btc
  stamp_url: string | null;
  tx_hash: string;
  holder_count: number;
}

export interface MarketListingAggregated {
  tick: string;
  floor_unit_price: number; // lower of stampscan floor_unit_price and openstamp price
  mcap: number; // computed on lower of stampscan floor_unit_price and openstamp price * totalSupply
  volume24: number; // sum of sum_1d + volume24
  stamp_url?: string | null;
  tx_hash: string;
  holder_count: number; // use stampscan holder_count value
  market_data: {
    stampscan: {
      price: number; // floor_unit_price
      volume24: number; // sum_1d
    };
    openstamp: {
      price: number; // price
      volume24: number; // volume24
    };
  };
}
