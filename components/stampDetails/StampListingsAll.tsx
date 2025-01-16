import {
  abbreviateAddress,
  formatSatoshisToBTC,
} from "$lib/utils/formatUtils.ts";
import { ScrollContainer } from "$components/shared/ScrollContainer.tsx";
import {
  generateColGroup,
  row,
  tableLabel,
  tableValue,
} from "$components/shared/types.ts";

interface Dispenser {
  source: string;
  give_remaining: number;
  escrow_quantity: number;
  give_quantity: number;
  satoshirate: number;
  tx_hash: string;
}

interface StampListingsAllProps {
  dispensers: Dispenser[];
}

export function StampListingsAll({ dispensers }: StampListingsAllProps) {
  // TODO(@reinamora_137): the secondary sort should be by creation date
  // const sortedDispensers = [...dispensers].sort((a, b) =>
  //   b.give_remaining - a.give_remaining
  // );

  return (
    <div class="relative w-full">
      <ScrollContainer class="max-h-48">
        <div class="w-[660px] min-[660px]:w-full">
          <table class={tableValue}>
            <colgroup>
              {generateColGroup([
                { width: "w-[16%]" },
                { width: "w-[10%]" },
                { width: "w-[10%]" },
                { width: "w-[10%]" },
                { width: "w-[26%]" },
                { width: "w-[14%]" },
                { width: "w-[14%]" },
              ]).map((col) => <col key={col.key} className={col.className} />)}
            </colgroup>
            <thead>
              <tr>
                <th class={`${tableLabel} text-left`}>PRICE</th>
                <th class={`${tableLabel} text-center`}>ESCROW</th>
                <th class={`${tableLabel} text-center`}>GIVE</th>
                <th class={`${tableLabel} text-center`}>REMAIN</th>
                <th class={`${tableLabel} text-center`}>SOURCE</th>
                <th class={`${tableLabel} text-center`}>ADDRESS</th>
                <th class={`${tableLabel} text-right`}>STATUS</th>
              </tr>
            </thead>
            <tbody>
              {dispensers?.map((dispenser, index) => {
                const isEmpty = dispenser.give_remaining === 0;
                const rowDispensersRemain = `${
                  isEmpty ? "text-stamp-grey-darker" : ""
                } ${row}`;

                return (
                  <tr
                    key={`${dispenser.tx_hash}-${index}`}
                    class={rowDispensersRemain}
                  >
                    <td class="text-left">
                      {formatSatoshisToBTC(dispenser.satoshirate)}
                    </td>
                    <td class="text-center">{dispenser.escrow_quantity}</td>
                    <td class="text-center">{dispenser.give_quantity}</td>
                    <td class="text-center">{dispenser.give_remaining}</td>
                    <td class="text-center">DISPENSER</td>
                    <td class="text-center">
                      <span class="tablet:hidden">
                        {abbreviateAddress(dispenser.source, 4)}
                      </span>
                      <span class="hidden tablet:inline">
                        {abbreviateAddress(dispenser.source, 8)}
                      </span>
                    </td>
                    <td class="text-right">
                      {!dispenser.close_block_index ||
                          dispenser.close_block_index <= 0
                        ? "OPEN"
                        : (
                          <a
                            href={`https://www.blockchain.com/explorer/transactions/btc/${dispenser.tx_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            class="hover:text-stamp-purple-bright"
                          >
                            CLOSED
                          </a>
                        )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </ScrollContainer>
    </div>
  );
}
