import { SRC20Row } from "$globals";
import { SRC20Repository } from "$server/database/src20Repository.ts";
import type { SRC20MarketData } from "$lib/types/marketData.d.ts";

export function enrichTokensWithMarketData(tokens: SRC20Row[], marketData: SRC20MarketData[]) {
  return tokens.map((token) => {
    // Find market data for this token
    const marketInfo = marketData.find(
      (item) => item.tick.toUpperCase() === token.tick.toUpperCase(),
    );

    // Use floor price or regular price from cache, convert from BTC to sats
    const floorPriceInSats = marketInfo 
      ? (marketInfo.floorPriceBTC || marketInfo.priceBTC || 0) * 1e8
      : 0;

    return {
      ...token,
      floor_unit_price: floorPriceInSats,
      value: floorPriceInSats * Number(token.amt || 0),
    };
  });
} 