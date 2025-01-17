import {
  abbreviateAddress,
  formatDate,
  formatSatoshisToBTC,
} from "$lib/utils/formatUtils.ts";
import { ScrollContainer } from "$components/shared/ScrollContainer.tsx";
import {
  cellAlign,
  colGroup,
  row,
  tableLabel,
  tableValue,
} from "$components/shared/TableStyles.ts";

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

export function StampSales({ dispenses }: StampSalesProps) {
  const headers = ["FROM", "TO", "QUANTITY", "PRICE", "DATE"];

  return (
    <div class="relative w-full">
      <ScrollContainer>
        <div class="w-[500px] min-[500px]:w-full">
          <table class={tableValue}>
            <colgroup>
              {colGroup().map((col) => (
                <col key={col.key} className={col.className} />
              ))}
            </colgroup>
            <thead>
              <tr>
                {headers.map((header, i) => (
                  <th
                    key={i}
                    class={`${tableLabel} ${cellAlign(i, headers.length)}`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {dispenses?.map((dispense, index) => (
                <tr key={`${dispense.tx_hash}-${index}`} class={row}>
                  <td class={cellAlign(0, headers.length)}>
                    <a
                      href={`/wallet/${dispense.source}`}
                      onClick={(e) => {
                        e.preventDefault();
                        globalThis.location.href = `/wallet/${dispense.source}`;
                      }}
                      className="hover:text-stamp-purple-bright cursor-pointer"
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
                      className="hover:text-stamp-purple-bright cursor-pointer"
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
              ))}
            </tbody>
          </table>
        </div>
      </ScrollContainer>
    </div>
  );
}
