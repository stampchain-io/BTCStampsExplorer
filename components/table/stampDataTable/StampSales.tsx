import { cellAlign, colGroup } from "$components/layout/types.ts";
import type { StampSalesProps } from "$types/ui.d.ts";
import { rowTable } from "$layout";
import {
  abbreviateAddress,
  formatDate,
  formatSatoshisToBTC,
} from "$lib/utils/ui/formatting/formatUtils.ts";
import { labelXs, valueDark, valueSm, valueSmLink } from "$text";

export function StampSalesTable({ dispenses }: StampSalesProps) {
  const headers = ["FROM", "TO", "QUANTITY", "PRICE", "DATE"];

  return (
    <div class="w-[500px] min-[500px]:w-full">
      <table class={`${valueSm} w-full`}>
        <colgroup>
          {colGroup().map((col) => <col key={col.key} class={col.className} />)}
        </colgroup>
        {(dispenses?.length ?? 0) > 0 && (
          <thead>
            <tr>
              {headers.map((header, i) => (
                <th
                  key={i}
                  class={`${labelXs} pb-1.5 ${cellAlign(i, headers.length)}`}
                >
                  {header}
                </th>
              ))}
              <th class="min-w-3 min-[660px]:hidden block" />
            </tr>
          </thead>
        )}
        <tbody>
          {(dispenses?.length ?? 0) > 0
            ? dispenses?.map((dispense, index) => (
              <tr key={`${dispense.tx_hash}-${index}`} class={rowTable}>
                <td class={cellAlign(0, headers.length)}>
                  <a
                    href={`/wallet/${dispense.source}`}
                    className={valueSmLink}
                  >
                    <span class="tablet:hidden">
                      {abbreviateAddress(dispense.source, 4)}
                    </span>
                    <span class="hidden tablet:inline">
                      {abbreviateAddress(dispense.source, 6)}
                    </span>
                  </a>
                </td>
                <td class={cellAlign(1, headers.length)}>
                  <a
                    href={`/wallet/${dispense.destination}`}
                    className={valueSmLink}
                  >
                    <span class="tablet:hidden">
                      {abbreviateAddress(dispense.destination, 4)}
                    </span>
                    <span class="hidden tablet:inline">
                      {abbreviateAddress(dispense.destination, 6)}
                    </span>
                  </a>
                </td>
                <td class={cellAlign(2, headers.length)}>
                  {dispense.dispense_quantity}
                </td>
                <td class={cellAlign(3, headers.length)}>
                  {formatSatoshisToBTC(dispense.satoshirate, {
                    includeSymbol: true,
                    decimals: 8,
                    stripZeros: true,
                  })}
                </td>
                <td class={cellAlign(4, headers.length)}>
                  {dispense.block_time
                    ? formatDate(new Date(dispense.block_time))
                    : "N/A"}
                </td>
              </tr>
            ))
            : (
              <tr>
                <td
                  class={`${valueDark} w-full`}
                >
                  NO SALES YET
                </td>
              </tr>
            )}
        </tbody>
      </table>
    </div>
  );
}
