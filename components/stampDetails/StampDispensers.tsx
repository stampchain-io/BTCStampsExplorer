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

const tableTextClassName =
  "w-full text-sm mobileLg:text-base text-stamp-grey-light font-light";
const dataLabelClassName =
  "text-base mobileLg:text-lg font-light text-stamp-grey-darker uppercase";

function DispenserRow({ dispenser }: { dispenser: Dispenser }) {
  const isClosedDispenser = dispenser.close_block_index > 0;
  const rowClassName = isClosedDispenser ? "text-[#666666]" : "";

  return (
    <tr class={rowClassName}>
      <td className="text-left w-full">
        {formatSatoshisToBTC(dispenser.satoshirate)}
      </td>
      <td className="text-center">
        {formatNumber(dispenser.escrow_quantity, 0)}
      </td>
      <td className="text-center">
        {formatNumber(dispenser.give_quantity, 0)}
      </td>
      <td className="text-center">
        {formatNumber(dispenser.give_remaining, 0)}
      </td>
      <td className="text-center">
        <span className="hidden tablet:inline">{dispenser.source}</span>
        <span className="inline tablet:hidden">
          {abbreviateAddress(dispenser.source)}
        </span>
      </td>
      <td className="text-center">
        {dispenser.confirmed ? "YES" : "NO"}
      </td>
      <td className="text-right">
        {!dispenser.close_block_index || dispenser.close_block_index <= 0
          ? "OPEN"
          : dispenser.close_block_index}
      </td>
    </tr>
  );
}

export function StampDispensers({ dispensers }: StampDispensersProps) {
  // TODO: the secondary sort should be by creation date
  const sortedDispensers = [...dispensers].sort((a, b) =>
    b.give_remaining - a.give_remaining
  );

  return (
    <div className="relative max-w-full">
      <div className="max-h-96 overflow-x-auto">
        <table class={`${tableTextClassName} w-full table-fixed`}>
          <colgroup>
            <col class="w-[16%] tablet:w-[12%]" /> {/* Price */}
            <col class="w-[12%] tablet:w-[8%]" /> {/* Escrow */}
            <col class="w-[12%] tablet:w-[8%]" /> {/* Give */}
            <col class="w-[12%] tablet:w-[8%]" /> {/* Remain */}
            <col class="w-[18%] tablet:w-[42%]" /> {/* Address column */}
            <col class="w-[16%] tablet:w-[12%]" /> {/* Confirmed */}
            <col class="w-[14%] tablet:w-[10%]" /> {/* Closed */}
          </colgroup>
          <thead>
            <tr>
              {tableHeaders.map(({ key, label }) => (
                <th
                  key={key}
                  scope="col"
                  class={`${dataLabelClassName} ${
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
