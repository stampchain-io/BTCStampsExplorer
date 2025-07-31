/* ===== SRC20 CARD MINTED COMPONENT ===== */
/*@baba-check styles*/
import { cellAlign } from "$components/layout/types.ts";
import ChartWidget from "$islands/layout/ChartWidget.tsx";
import { formatDate } from "$lib/utils/ui/formatting/formatUtils.ts";
import { valueSm } from "$text";
import { SRC20CardBase, SRC20CardBaseProps } from "$islands/card/SRC20CardBase.tsx";

// Local utility functions for v2.3 market data format
function getFloorPrice(src20: any): number {
  return src20?.market_data?.floor_price_btc || 0;
}

function getMarketCapBTC(src20: any): number {
  return src20?.market_data?.market_cap_btc || 0;
}

function getVolume24h(src20: any): number {
  return src20?.market_data?.volume_24h_btc || 0;
}

function hasMarketData(src20: any): boolean {
  return !!(src20?.market_data && src20.market_data.floor_price_btc);
}

/* ===== COMPONENT ===== */
export function SRC20CardMinted(
  { src20, fromPage, onImageClick, totalColumns }: SRC20CardBaseProps,
) {
  return (
    <SRC20CardBase
      src20={src20}
      {...(fromPage && { fromPage })}
      {...(onImageClick && { onImageClick })}
      totalColumns={totalColumns}
    >
      {/* Deploy Cell */}
      <td class={`${cellAlign(1, totalColumns)} ${valueSm}`}>
        {formatDate(new Date(src20.block_time), {
          month: "numeric",
          day: "numeric",
          year: "numeric",
        }).toUpperCase()}
      </td>

      {/* Holders Cell */}
      <td class={`${cellAlign(2, totalColumns)} ${valueSm}`}>
        {Number(src20.holders).toLocaleString()}
      </td>

      {/* Price Cell - ✅ CLEANED: No more root-level field access */}
      <td class={`${cellAlign(3, totalColumns)} ${valueSm}`}>
        {Math.round(getFloorPrice(src20) * 1e8).toLocaleString()}
        <span class="text-stamp-grey-light ml-1">SATS</span>
      </td>

      {/* Change Cell */}
      <td class={`${cellAlign(4, totalColumns)} ${valueSm}`}>
        <span class="text-stamp-grey-light">N/A%</span>
      </td>

      {/* Volume Cell - ✅ CLEANED: No more type casting chaos */}
      <td class={`${cellAlign(5, totalColumns)} ${valueSm}`}>
        {Math.round(getVolume24h(src20)).toLocaleString()}
        <span class="text-stamp-grey-light ml-1">BTC</span>
      </td>

      {/* Market Cap Cell - ✅ CLEANED: No more type casting chaos */}
      <td class={`${cellAlign(6, totalColumns)} ${valueSm}`}>
        {Math.round(getMarketCapBTC(src20) * 1e8).toLocaleString()}
        <span class="text-stamp-grey-light ml-1">SATS</span>
      </td>

      {/* Chart Cell - ✅ IMPROVED: Type-safe chart access */}
      <td class={`${cellAlign(7, totalColumns)} ${valueSm}`}>
        <ChartWidget
          fromPage="home"
          data={hasMarketData(src20) ? (src20 as any).chart : null}
          tick={src20.tick}
        />
      </td>
    </SRC20CardBase>
  );
}
