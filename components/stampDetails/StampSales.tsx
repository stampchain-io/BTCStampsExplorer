import { abbreviateAddress } from "utils/util.ts";

export function StampSales(
  { dispenses }: {
    dispenses: {
      source: string;
      destination: string;
      dispense_quantity: number;
      satoshirate: number;
    }[];
  },
) {
  return (
    <div className="relative overflow-x-auto shadow-md max-h-96 max-w-256">
      <p class="text-[#F5F5F5] text-[26px] font-semibold">
        Sales ({dispenses.length})
      </p>
      <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 sm:rounded-lg">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th scope="col" className="px-6 py-3">
              From
            </th>
            <th scope="col" className="px-6 py-3">
              To
            </th>
            <th scope="col" className="px-6 py-3">
              Quantity
            </th>
            <th scope="col" className="px-6 py-3">
              Price (satoshis)
            </th>
          </tr>
        </thead>
        <tbody>
          {dispenses.map((dispense, index) => (
            <tr
              className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700"
              key={index}
            >
              <td className="px-6 py-4">
                {abbreviateAddress(dispense.source)}
              </td>
              <td className="px-6 py-4">
                {abbreviateAddress(dispense.destination)}
              </td>
              <td className="px-6 py-4 text-sm">
                {dispense.dispense_quantity}
              </td>
              <td className="px-6 py-4 text-sm">{dispense.satoshirate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
