import { formatNumber, formatSatoshisToBTC } from "$lib/utils/formatUtils.ts";
import { ScrollContainer } from "$layout";
import {
  cellAlign,
  colGroup,
  row,
  tableLabel,
  tableValue,
} from "$components/shared/TableStyles.ts";

export interface Dispenser {
  source: string;
  give_remaining: number;
  escrow_quantity: number;
  give_quantity: number;
  satoshirate: number;
  confirmed: boolean;
  close_block_index: number;
  block_index?: number;
  isSelected?: boolean;
}

interface StampListingsOpenProps {
  dispensers: Dispenser[];
  floorPrice: number;
  onSelectDispenser: (dispenser: Dispenser) => void;
  selectedDispenser: Dispenser | null;
}

export function StampListingsOpen({
  dispensers,
  floorPrice,
  onSelectDispenser,
  selectedDispenser,
}: StampListingsOpenProps) {
  const headers = ["PRICE", "ESCROW", "GIVE", "REMAIN", "SOURCE"];

  const sortedDispensers = [...dispensers]
    .filter((dispenser) => dispenser.give_remaining > 0)
    .sort((a, b) => b.give_remaining - a.give_remaining);

  return (
    <div class="relative w-full">
      <ScrollContainer class="max-h-48">
        <div class="w-full">
          <table class={tableValue}>
            <colgroup>
              {colGroup([
                {
                  width:
                    "w-[35%] min-[420px]:w-[23%] min-[880px]:w-[35%] min-[1080px]:w-[23%]",
                },
                {
                  width:
                    "w-[14%] min-[420px]:w-[18%] min-[880px]:w-[14%] min-[1080px]:w-[18%]",
                },
                {
                  width:
                    "w-[14%] min-[420px]:w-[18%] min-[880px]:w-[14%] min-[1080px]:w-[18%]",
                },
                {
                  width:
                    "w-[14%] min-[420px]:w-[18%] min-[880px]:w-[14%] min-[1080px]:w-[18%]",
                },
                {
                  width:
                    "w-[23%] min-[420px]:w-[23%] min-[880px]:w-[23%] min-[1080px]:w-[23%]",
                },
              ]).map((col) => <col key={col.key} className={col.className} />)}
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
              {sortedDispensers.map((dispenser) => {
                const isEmpty = dispenser.give_remaining === 0;
                const isFloorPrice =
                  (dispenser.satoshirate / 100000000) === floorPrice;
                const rowDispensers = `${
                  isEmpty ? "text-stamp-grey-darker" : ""
                } ${row} cursor-pointer group ${
                  selectedDispenser?.source === dispenser.source ||
                    (!selectedDispenser && isFloorPrice)
                    ? "text-stamp-grey-light"
                    : "text-stamp-grey-darker"
                }`;

                return (
                  <tr
                    key={dispenser.source}
                    class={rowDispensers}
                    onClick={() => onSelectDispenser(dispenser)}
                  >
                    <td
                      class={`${
                        cellAlign(0, headers.length)
                      } group-hover:text-stamp-purple-bright`}
                    >
                      {formatSatoshisToBTC(dispenser.satoshirate)}
                    </td>
                    <td class={cellAlign(1, headers.length)}>
                      {formatNumber(dispenser.escrow_quantity, 0)}
                    </td>
                    <td class={cellAlign(2, headers.length)}>
                      {formatNumber(dispenser.give_quantity, 0)}
                    </td>
                    <td class={cellAlign(3, headers.length)}>
                      {formatNumber(dispenser.give_remaining, 0)}
                    </td>
                    <td class={cellAlign(4, headers.length)}>
                      DISPENSER
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
