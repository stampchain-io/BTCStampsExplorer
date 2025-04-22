/* ===== SRC20 CARD MINTED COMPONENT ===== */
/*@baba-check styles*/
import { SRC20CardBase, SRC20CardBaseProps } from "./SRC20CardBase.tsx";
import { formatDate } from "$lib/utils/formatUtils.ts";
import ChartWidget from "$islands/layout/ChartWidget.tsx";
import { cellAlign } from "$components/layout/types.ts";
import { valueSm } from "$text";

/* ===== COMPONENT ===== */
export function SRC20CardMinted(
  { src20, fromPage, onImageClick, totalColumns }: SRC20CardBaseProps,
) {
  return (
    <SRC20CardBase
      src20={src20}
      fromPage={fromPage}
      onImageClick={onImageClick}
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

      {/* Price Cell */}
      <td class={`${cellAlign(3, totalColumns)} ${valueSm}`}>
        {Math.round((src20.floor_unit_price ?? 0) * 1e8).toLocaleString()}
        <span class="text-stamp-grey-light ml-1">SATS</span>
      </td>

      {/* Change Cell */}
      <td class={`${cellAlign(4, totalColumns)} ${valueSm}`}>
        <span class="text-stamp-grey-light">N/A%</span>
      </td>

      {/* Volume Cell */}
      <td class={`${cellAlign(5, totalColumns)} ${valueSm}`}>
        {Math.round(src20.volume24 ?? 0).toLocaleString()}
        <span class="text-stamp-grey-light ml-1">BTC</span>
      </td>

      {/* Market Cap Cell */}
      <td class={`${cellAlign(6, totalColumns)} ${valueSm}`}>
        {Math.round((src20.market_cap ?? 0) * 1e8).toLocaleString()}
        <span class="text-stamp-grey-light ml-1">SATS</span>
      </td>

      {/* Chart Cell */}
      <td class={`${cellAlign(7, totalColumns)} ${valueSm}`}>
        <ChartWidget
          fromPage="home"
          data={src20.chart}
          tick={src20.tick}
        />
      </td>
    </SRC20CardBase>
  );
}
