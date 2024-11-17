import dayjs from "$dayjs/";
import relativeTime from "$dayjs/plugin/relativeTime";
import { formatSatoshisToBTC } from "$lib/utils/formatUtils.ts";

dayjs.extend(relativeTime);

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
  { key: "address", label: "Address" },
  { key: "escrow", label: "Escrow" },
  { key: "give", label: "Give" },
  { key: "remaining", label: "Remaining" },
  { key: "price", label: "Price" },
  { key: "confirmed", label: "Confirmed" },
  { key: "closeBlock", label: "Close Block" },
];

function DispenserRow({ dispenser }: { dispenser: Dispenser }) {
  return (
    <tr>
      <td className="pr-3 tablet:pr-6 py-2 tablet:py-4">{dispenser.source}</td>
      <td className="px-3 tablet:px-6 py-2 tablet:py-4 text-sm">
        {dispenser.escrow_quantity}
      </td>
      <td className="px-3 tablet:px-6 py-2 tablet:py-4 text-sm">
        {dispenser.give_quantity}
      </td>
      <td className="px-3 tablet:px-6 py-2 tablet:py-4 text-sm">
        {dispenser.give_remaining}
      </td>
      <td className="px-3 tablet:px-6 py-2 tablet:py-4 text-sm">
        {formatSatoshisToBTC(dispenser.satoshirate)}
      </td>
      <td className="px-3 tablet:px-6 py-2 tablet:py-4 text-sm">
        {dispenser.confirmed ? "Yes" : "No"}
      </td>
      <td className="pl-3 tablet:pl-6 py-2 tablet:py-4 text-sm">
        {dispenser.close_block_index}
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
    <div className="relative shadow-md max-w-full">
      <div className="max-h-96 overflow-x-auto">
        <table className="w-full text-sm text-left rtl:text-right text-[#666666] mobileLg:rounded-lg">
          <thead className="text-sm tablet:text-lg uppercase">
            <tr>
              {tableHeaders.map(({ key, label }) => (
                <th
                  key={key}
                  scope="col"
                  className={`${
                    key === "address"
                      ? "pr-3 tablet:pr-6"
                      : key === "closeBlock"
                      ? "pl-3 tablet:pl-6"
                      : "px-3 tablet:px-6"
                  } py-1 tablet:py-3 font-light`}
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
