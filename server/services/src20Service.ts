import { SRC20Row } from "$globals";
import { SRC20Repository } from "$server/database/src20Repository.ts";

export function enrichTokensWithMarketData(tokens: SRC20Row[], marketData: any[]) {
  return tokens.map((token) => {
    // Let repository handle the conversion
    const marketInfo = marketData.find(
      (item) => item.tick.toUpperCase() === token.tick.toUpperCase(),
    ) || { floor_unit_price: 0 };

    return {
      ...token,
      floor_unit_price: marketInfo.floor_unit_price,
      value: marketInfo.floor_unit_price * Number(token.amt || 0),
    };
  });
} 