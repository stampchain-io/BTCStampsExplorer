import {
  abbreviateAddress,
  formatNumber,
  formatSatoshisToBTC,
} from "$lib/utils/formatUtils.ts";

interface Dispenser {
  source: string;
  give_remaining: number;
  escrow_quantity: number;
  give_quantity: number;
  satoshirate: number;
  confirmed: boolean;
  close_block_index: number;
}

interface StampDispensersProps {
  dispensers: Dispenser[];
}

const tableHeaders = [
  { key: "price", label: "Price" },
  { key: "escrow", label: "Escrow" },
  { key: "give", label: "Give" },
  { key: "remaining", label: "Remain" },
  { key: "address", label: "Address" },
  { key: "confirmed", label: "Confirmed" },
  { key: "closeBlock", label: "Closed" },
];

const tableLabel =
  "text-sm mobileLg:text-base font-light text-stamp-grey-darker uppercase";
const tableValue =
  "text-xs mobileLg:text-sm font-normal text-stamp-grey-light w-full";

function DispenserRow({ dispenser }: { dispenser: Dispenser }) {
  const isClosedDispenser = dispenser.close_block_index > 0;
  const rowClassName = isClosedDispenser ? "text-stamp-grey-darker" : "";

  return (
    <tr class={rowClassName}>
      <td className="text-left py-0">
        {formatSatoshisToBTC(dispenser.satoshirate)}
      </td>
      <td className="text-center py-0">
        {formatNumber(dispenser.escrow_quantity, 0)}
      </td>
      <td className="text-center py-0">
        {formatNumber(dispenser.give_quantity, 0)}
      </td>
      <td className="text-center py-0">
        {formatNumber(dispenser.give_remaining, 0)}
      </td>
      <td className="text-center py-0">
        <span className="tablet:hidden">
          {abbreviateAddress(dispenser.source, 4)}
        </span>
        <span className="hidden tablet:inline">
          {abbreviateAddress(dispenser.source, 8)}
        </span>
      </td>
      <td className="text-center py-0">
        {dispenser.confirmed ? "YES" : "NO"}
      </td>
      <td className="text-right py-0">
        {!dispenser.close_block_index || dispenser.close_block_index <= 0
          ? "OPEN"
          : dispenser.close_block_index}
      </td>
    </tr>
  );
}

export function StampDispensers({ dispensers }: StampDispensersProps) {
  // TODO(@reinamora_137): the secondary sort should be by creation date
  const sortedDispensers = [...dispensers].sort((a, b) =>
    b.give_remaining - a.give_remaining
  );

  return (
    <div className="relative max-w-full">
      <div className="max-h-96 overflow-x-auto">
        <table class={`${tableValue} w-full table-fixed`}>
          <colgroup>
            <col class="w-[16%] tablet:w-[14%]" /> {/* Price */}
            <col class="w-[12%] tablet:w-[10%]" /> {/* Escrow */}
            <col class="w-[12%] tablet:w-[10%]" /> {/* Give */}
            <col class="w-[12%] tablet:w-[10%]" /> {/* Remain */}
            <col class="w-[20%] tablet:w-[28%]" /> {/* Address column */}
            <col class="w-[14%] tablet:w-[14%]" /> {/* Confirmed */}
            <col class="w-[14%] tablet:w-[14%]" /> {/* Closed */}
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
                      : key === "closeBlock"
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
              <DispenserRow key={dispenser.source} dispenser={dispenser} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
