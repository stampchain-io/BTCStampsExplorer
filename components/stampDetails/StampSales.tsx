import { abbreviateAddress } from "utils/util.ts";
import { formatSatoshisToBTC } from "utils/util.ts";

export function StampSales(
  { dispenses }: {
    dispenses: {
      source: string;
      destination: string;
      dispense_quantity: number;
      satoshirate: number;
      confirmed: boolean;
      close_block_index: number;
    }[];
  },
) {
  return (
    <div className="relative shadow-md max-w-256">
      {
        /* <p class="text-[#F5F5F5] text-[26px] font-semibold">
        Sales ({dispenses.length})
      </p> */
      }
      {
        /* <div className={"custom-scrollbar max-h-96 overflow-x-auto"}>
        <div className="w-full min-h-96 h-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 bg-[#2B0E49] py-6 pl-7">
          <div
            className={"border border-[#B9B9B9] border-l-0 border-b-0 min-h-96 h-full"}
          >
            {dispenses.map((dispense, index) => (
              <div
                className="border-b border-[#B9B9B9] flex justify-between text-[#F5F5F5] text-[18px]"
                key={index}
              >
                <p className="pr-6 py-4">
                  {abbreviateAddress(dispense.source)}
                </p>
                <p className="pr-6 py-4">
                  {abbreviateAddress(dispense.destination)}
                </p>
                <p className="pr-6 py-4">
                  {dispense.dispense_quantity}
                </p>
                <p className="pr-6 py-4">{dispense.satoshirate}</p>
              </div>
            ))}
          </div>
        </div>
      </div> */
      }
      <div className="max-h-96 overflow-x-auto">
        <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 sm:rounded-lg">
          <thead className="text-lg font-semibold uppercase">
            <tr>
              <th scope="col" className="pr-3 md:pr-6 py-1 md:py-3">
                From
              </th>
              <th scope="col" className="px-3 md:px-6 py-1 md:py-3">
                To
              </th>
              <th scope="col" className="px-3 md:px-6 py-1 md:py-3">
                Quantity
              </th>
              <th scope="col" className="px-3 md:px-6 py-1 md:py-3">
                Price (BTC)
              </th>
              <th scope="col" className="px-3 md:px-6 py-1 md:py-3">
                Confirmed
              </th>
              <th scope="col" className="pl-3 md:pl-6 py-1 md:py-3">
                Close Block
              </th>
            </tr>
          </thead>
          <tbody>
            {dispenses.map((dispense, index) => (
              <tr
                key={index}
              >
                <td className="pr-3 md:pr-6 py-2 md:py-4">
                  <a
                    href={`/wallet/${dispense.source}`}
                  >
                    {abbreviateAddress(dispense.source)}
                  </a>
                </td>
                <td className="px-3 md:px-6 py-2 md:py-4">
                  <a
                    href={`/wallet/${dispense.destination}`}
                  >
                    {abbreviateAddress(dispense.destination)}
                  </a>
                </td>
                <td className="px-3 md:px-6 py-2 md:py-4 text-sm">
                  {dispense.dispense_quantity}
                </td>
                <td className="px-3 md:px-6 py-2 md:py-4 text-sm">
                  {formatSatoshisToBTC(dispense.satoshirate)}
                </td>
                <td className="px-3 md:px-6 py-2 md:py-4 text-sm">
                  {dispense.confirmed ? "Yes" : "No"}
                </td>
                <td className="pl-3 md:pl-6 py-2 md:py-4 text-sm">
                  {dispense.close_block_index}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
