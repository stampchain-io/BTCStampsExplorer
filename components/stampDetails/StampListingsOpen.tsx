import { formatNumber, formatSatoshisToBTC } from "$lib/utils/formatUtils.ts";
import { ScrollContainer } from "../shared/ScrollContainer.tsx";

export interface Dispenser {
  satoshirate: number;
  source: string;
  give_quantity: number;
  give_remaining: number;
  escrow_quantity: number;
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

const tableHeaders = [
  { key: "price", label: "Price" },
  { key: "quantity", label: "Escrow/Give" },
  { key: "remaining", label: "Remain" },
  { key: "type", label: "Type" },
];

const tableLabel =
  "text-sm mobileLg:text-base font-light text-stamp-grey-darker uppercase";
const tableValue =
  "text-xs mobileLg:text-sm font-normal text-stamp-grey-light w-full";

export function StampListingsOpen({
  dispensers,
  floorPrice,
  onSelectDispenser,
  selectedDispenser,
}: StampListingsOpenProps) {
  function DispenserRow({
    dispenser,
    floorPrice,
    onSelect,
    isSelected,
  }: {
    dispenser: Dispenser;
    floorPrice: number;
    onSelect: () => void;
    isSelected: boolean;
  }) {
    const isEmpty = dispenser.give_remaining === 0;
    const isFloorPrice = (dispenser.satoshirate / 100000000) === floorPrice;

    const rowDispensers = `${
      isEmpty ? "text-stamp-grey-darker" : ""
    } h-8 hover:bg-stamp-purple/10 cursor-pointer ${
      isSelected || (!selectedDispenser && isFloorPrice)
        ? "text-stamp-grey-light"
        : "text-stamp-grey-darker"
    }`;

    return (
      <tr
        className={rowDispensers}
        onClick={onSelect}
      >
        <td className="text-left">
          {formatSatoshisToBTC(dispenser.satoshirate)}
        </td>
        <td className="text-center">
          {`${formatNumber(dispenser.escrow_quantity, 0)}/${
            formatNumber(dispenser.give_quantity, 0)
          }`}
        </td>
        <td className="text-center">
          {formatNumber(dispenser.give_remaining, 0)}
        </td>
        <td className="text-right">
          DISPENSER
        </td>
      </tr>
    );
  }

  if (!dispensers || dispensers.length === 0) {
    return <div>No listings available</div>;
  }

  const sortedDispensers = [...dispensers].sort((a, b) =>
    b.give_remaining - a.give_remaining
  );

  return (
    <div class="relative w-full">
      <ScrollContainer class="max-h-48">
        <div class="w-[660px] min-[660px]:w-full">
          <table class={tableValue}>
            <colgroup>
              <col class="w-[25%]" /> {/* Price */}
              <col class="w-[25%]" /> {/* Quantity */}
              <col class="w-[25%]" /> {/* Remain */}
              <col class="w-[25%]" /> {/* Type */}
            </colgroup>
            <thead>
              <tr>
                {tableHeaders.map(({ key, label }) => (
                  <th
                    key={key}
                    scope="col"
                    class={`${tableLabel} pb-1.5 ${
                      key === "price"
                        ? "text-left"
                        : key === "type"
                        ? "text-right"
                        : "text-center"
                    }`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {sortedDispensers.map((dispenser) => (
                <DispenserRow
                  key={dispenser.source}
                  dispenser={dispenser}
                  floorPrice={floorPrice}
                  onSelect={() => onSelectDispenser(dispenser)}
                  isSelected={selectedDispenser?.source === dispenser.source}
                />
              ))}
            </tbody>
          </table>
        </div>
      </ScrollContainer>
    </div>
  );
}
