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

const tableTextClassName =
  "w-full text-sm mobileLg:text-base text-stamp-grey-light font-light";
const dataLabelClassName =
  "text-base mobileLg:text-lg font-light text-stamp-grey-darker uppercase";

function DispenseRow({ dispense }: { dispense: Dispense }) {
  return (
    <tr>
      <td className="text-left w-full">
        <a href={`/wallet/${dispense.source}`}>
          {abbreviateAddress(dispense.source)}
        </a>
      </td>
      <td className="text-center">
        <a href={`/wallet/${dispense.destination}`}>
          {abbreviateAddress(dispense.destination)}
        </a>
      </td>
      <td className="text-center">
        {dispense.dispense_quantity}
      </td>
      <td className="text-center">
        {formatSatoshisToBTC(dispense.satoshirate)}
      </td>
      <td className="text-right">
        {dispense.confirmed ? "YES" : "NO"}
      </td>
    </tr>
  );
}

export function StampSales({ dispenses }: StampSalesProps) {
  return (
    <div className="relative shadow-md max-w-full">
      <div className="max-h-96 overflow-x-auto">
        <table className={`${tableTextClassName} w-full table-fixed`}>
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
                  className={`${dataLabelClassName} ${
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
