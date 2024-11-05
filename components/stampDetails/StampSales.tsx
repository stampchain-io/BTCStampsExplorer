import { abbreviateAddress } from "$lib/utils/util.ts";
import { formatSatoshisToBTC } from "$lib/utils/util.ts";

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
  { key: "price", label: "Price (BTC)" },
  { key: "confirmed", label: "Confirmed" },
  { key: "closeBlock", label: "Close Block" },
];

function DispenseRow({ dispense }: { dispense: Dispense }) {
  return (
    <tr>
      <td className="pr-3 tablet:pr-6 py-2 tablet:py-4">
        <a href={`/wallet/${dispense.source}`}>
          {abbreviateAddress(dispense.source)}
        </a>
      </td>
      <td className="px-3 tablet:px-6 py-2 tablet:py-4">
        <a href={`/wallet/${dispense.destination}`}>
          {abbreviateAddress(dispense.destination)}
        </a>
      </td>
      <td className="px-3 tablet:px-6 py-2 tablet:py-4 text-sm">
        {dispense.dispense_quantity}
      </td>
      <td className="px-3 tablet:px-6 py-2 tablet:py-4 text-sm">
        {formatSatoshisToBTC(dispense.satoshirate)}
      </td>
      <td className="px-3 tablet:px-6 py-2 tablet:py-4 text-sm">
        {dispense.confirmed ? "Yes" : "No"}
      </td>
      <td className="pl-3 tablet:pl-6 py-2 tablet:py-4 text-sm">
        {dispense.close_block_index}
      </td>
    </tr>
  );
}

export function StampSales({ dispenses }: StampSalesProps) {
  return (
    <div className="relative shadow-md max-w-full">
      <div className="max-h-96 overflow-x-auto">
        <table className="w-full text-sm text-left rtl:text-right text-[#666666] mobileLg:rounded-lg">
          <thead className="text-lg uppercase">
            <tr>
              {tableHeaders.map(({ key, label }) => (
                <th
                  key={key}
                  scope="col"
                  className={`${
                    key === "from"
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
            {dispenses.map((dispense, index) => (
              <DispenseRow key={index} dispense={dispense} />
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
