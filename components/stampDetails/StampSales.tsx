import {
  abbreviateAddress,
  formatDate,
  formatSatoshisToBTC,
} from "$lib/utils/formatUtils.ts";
import { ScrollContainer } from "$components/shared/ScrollContainer.tsx";
import { row, tableLabel, tableValue } from "$components/shared/types.ts";

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
  return (
    <div class="relative w-full">
      <ScrollContainer class="max-h-48">
        <div class="w-[480px] min-[480px]:w-full">
          <table class={tableValue}>
            <colgroup>
              <col className="w-[20%]" />
              <col className="w-[20%]" />
              <col className="w-[20%]" />
              <col className="w-[20%]" />
              <col className="w-[20%]" />
            </colgroup>
            <thead>
              <tr>
                <th class={`${tableLabel} text-left`}>FROM</th>
                <th class={`${tableLabel} text-center`}>TO</th>
                <th class={`${tableLabel} text-center`}>QUANTITY</th>
                <th class={`${tableLabel} text-center`}>PRICE</th>
                <th class={`${tableLabel} text-right`}>DATE</th>
              </tr>
            </thead>
            <tbody>
              {dispenses?.map((dispense, index) => (
                <tr key={`${dispense.tx_hash}-${index}`} class={row}>
                  <td class="text-left">
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
                  <td class="text-center">
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
                  <td class="text-center">{dispense.dispense_quantity}</td>
                  <td class="text-center">
                    {formatSatoshisToBTC(dispense.satoshirate, {
                      includeSymbol: true,
                      decimals: 8,
                      stripZeros: true,
                    })}
                  </td>
                  <td class="text-right uppercase">
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
