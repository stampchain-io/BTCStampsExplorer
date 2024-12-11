import {
  abbreviateAddress,
  formatSatoshisToBTC,
} from "$lib/utils/formatUtils.ts";

interface Dispense {
  source: string;
  destination: string;
  dispense_quantity: number;
  satoshirate: number;
  confirmed: boolean;
  close_block_index: number;
}

interface StampSalesProps {
  dispenses: Dispense[];
}

const tableHeaders = [
  { key: "from", label: "From" },
  { key: "to", label: "To" },
  { key: "quantity", label: "Quantity" },
  { key: "price", label: "Price" },
  { key: "confirmed", label: "Confirmed" },
];

const tableLabelClassName =
  "text-sm mobileLg:text-base font-light text-stamp-grey-darker uppercase";
const tableValueClassName =
  "text-xs mobileLg:text-sm font-normal text-stamp-grey-light w-full";

function DispenseRow({ dispense }: { dispense: Dispense }) {
  return (
    <tr>
      <td className="text-left py-0">
        <a href={`/wallet/${dispense.source}`}>
          <span className="tablet:hidden">
            {abbreviateAddress(dispense.source, 4)}
          </span>
          <span className="hidden tablet:inline">
            {abbreviateAddress(dispense.source, 6)}
          </span>
        </a>
      </td>
      <td className="text-center py-0">
        <a href={`/wallet/${dispense.destination}`}>
          <span className="tablet:hidden">
            {abbreviateAddress(dispense.destination, 4)}
          </span>
          <span className="hidden tablet:inline">
            {abbreviateAddress(dispense.destination, 6)}
          </span>
        </a>
      </td>
      <td className="text-center py-0">
        {dispense.dispense_quantity}
      </td>
      <td className="text-center py-0">
        {formatSatoshisToBTC(dispense.satoshirate)}
      </td>
      <td className="text-right py-0">
        {dispense.confirmed ? "YES" : "NO"}
      </td>
    </tr>
  );
}

export function StampSales({ dispenses }: StampSalesProps) {
  return (
    <div className="relative shadow-md max-w-full">
      <div className="max-h-96 overflow-x-auto">
        <table className={`${tableValueClassName} w-full table-fixed`}>
          <colgroup>
            <col className="w-[20%]" /> {/* From column */}
            <col className="w-[20%]" /> {/* To */}
            <col className="w-[20%]" /> {/* Quantity */}
            <col className="w-[20%]" /> {/* Price */}
            <col className="w-[20%]" /> {/* Confirmed */}
          </colgroup>
          <thead>
            <tr>
              {tableHeaders.map(({ key, label }) => (
                <th
                  key={key}
                  scope="col"
                  class={`${tableLabelClassName} pb-1.5 ${
                    key === "from"
                      ? "text-left"
                      : key === "confirmed"
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
            {dispenses.map((dispense, index) => (
              <DispenseRow key={index} dispense={dispense} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
