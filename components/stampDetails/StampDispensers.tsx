import dayjs from "$dayjs/";
import relativeTime from "$dayjs/plugin/relativeTime";
import { formatSatoshisToBTC } from "utils/util.ts";

dayjs.extend(relativeTime);

export function StampDispensers(
  { dispensers }: {
    dispensers: {
      source: string;
      give_remaining: number;
      escrow_quantity: number;
      give_quantity: number;
      satoshirate: number;
      confirmed: boolean;
      close_block_index: number;
    }[];
  },
) {
  // TODO: the secondary sort should be by creation date
  const sortedDispensers = [...dispensers].sort((a, b) =>
    b.give_remaining - a.give_remaining
  );

  return (
    <div className="relative shadow-md max-w-256">
      <p class="text-[#F5F5F5] text-[26px] font-semibold">
        Dispensers ({dispensers.length})
      </p>
      {
        /* <div className={"custom-scrollbar max-h-96 overflow-x-auto"}>
        <div className="w-full min-h-96 h-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 bg-[#2B0E49] py-6 pl-7">
          <div
            className={"border border-[#B9B9B9] border-l-0 border-b-0 min-h-96 h-full"}
          >
            {dispensers.map((dispenser) => (
              <div
                className="border-b border-[#B9B9B9] flex justify-between text-[#F5F5F5] text-[18px]"
                key={dispenser.source}
              >
                <p className="pr-6 py-4">
                  {abbreviateAddress(dispenser.source)}
                </p>
                <p className="pr-6 py-4">
                  {dispenser.give_remaining}
                </p>
                <p className="pr-6 py-4">{dispenser.satoshirate}</p>
              </div>
            ))}
          </div>
        </div>
      </div> */
      }
      <div className="max-h-96 overflow-x-auto">
        <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 sm:rounded-lg">
          <thead className="text-lg font-semibold uppercase text-[#C184FF] bg-[#2B0E49] border-b border-gray-700">
            <tr>
              <th scope="col" className="px-6 py-3">
                Address
              </th>
              <th scope="col" className="px-6 py-3">
                Escrow Qty
              </th>
              <th scope="col" className="px-6 py-3">
                Give Qty
              </th>
              <th scope="col" className="px-6 py-3">
                Remaining
              </th>
              <th scope="col" className="px-6 py-3">
                Price (BTC)
              </th>
              <th scope="col" className="px-6 py-3">
                Confirmed
              </th>
              <th scope="col" className="px-6 py-3">
                Close Block
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedDispensers.map((dispenser) => (
              <tr
                className="odd:bg-gray-900 even:bg-gray-800"
                key={dispenser.source}
              >
                <td className="px-6 py-4">
                  {/* TODO: this should popup perhaps with a barcode (or construct a trx for the wallet) similar to https://tokenscan.io/tx/0b4f6ad4eb97760cdd6bd70cc533f04030411f9fa13241ca2da53af32de0e121 */}
                  {dispenser.source}
                </td>
                <td className="px-6 py-4 text-sm">
                  {dispenser.escrow_quantity}
                </td>
                <td className="px-6 py-4 text-sm">
                  {dispenser.give_quantity}
                </td>
                <td className="px-6 py-4 text-sm">
                  {dispenser.give_remaining}
                </td>
                <td className="px-6 py-4 text-sm">
                  {/* TODO: display USD price as well */}
                  {formatSatoshisToBTC(dispenser.satoshirate)}
                </td>
                <td className="px-6 py-4 text-sm">
                  {dispenser.confirmed ? "Yes" : "No"}
                </td>
                <td className="px-6 py-4 text-sm">
                  {dispenser.close_block_index}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
