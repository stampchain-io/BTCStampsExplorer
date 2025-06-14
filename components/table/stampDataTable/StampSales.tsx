import {
  abbreviateAddress,
  formatDate,
  formatSatoshisToBTC,
} from "$lib/utils/formatUtils.ts";
import { cellAlign, colGroup } from "$components/layout/types.ts";
import { rowTable } from "$layout";
import { labelXs, valueDark, valueSm, valueSmLink } from "$text";

interface Dispense {
  source: string;
  destination: string;
  dispense_quantity: number;
  satoshirate: number;
  tx_hash: string;
  block_time: string;
}

interface StampSalesProps {
  dispenses: Dispense[];
}

export function StampSalesTable({ dispenses }: StampSalesProps) {
  const headers = ["FROM", "TO", "QUANTITY", "PRICE", "DATE"];

  return (
    <div class="w-[500px] min-[500px]:w-full">
      <table class={`${valueSm} w-full`}>
        <colgroup>
          {colGroup().map((col) => (
            <col key={col.key} className={col.className} />
          ))}
        </colgroup>
        {dispenses.length > 0 && (
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
          {dispenses.length
            ? dispenses?.map((dispense, index) => (
              <tr key={`${dispense.tx_hash}-${index}`} class={rowTable}>
                <td class={cellAlign(0, headers.length)}>
                  <a
                    href={`/wallet/${dispense.source}`}
                    onClick={(e) => {
                      e.preventDefault();
                      globalThis.location.href = `/wallet/${dispense.source}`;
                    }}
                    className={valueSmLink}
                  >
                    <span className="tablet:hidden">
                      {abbreviateAddress(dispense.source, 4)}
                    </span>
                    <span className="hidden tablet:inline">
                      {abbreviateAddress(dispense.source, 6)}
                    </span>
                  </a>
                </td>
                <td class={cellAlign(1, headers.length)}>
                  <a
                    href={`/wallet/${dispense.destination}`}
                    onClick={(e) => {
                      e.preventDefault();
                      globalThis.location.href =
                        `/wallet/${dispense.destination}`;
                    }}
                    className={valueSmLink}
                  >
                    <span className="tablet:hidden">
                      {abbreviateAddress(dispense.destination, 4)}
                    </span>
                    <span className="hidden tablet:inline">
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
                  {formatDate(new Date(dispense.block_time))}
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
