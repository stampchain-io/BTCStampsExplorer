import dayjs from "$dayjs/";
import relativeTime from "$dayjs/plugin/relativeTime";

import { abbreviateAddress } from "utils/util.ts";

dayjs.extend(relativeTime);

export function StampDispensers(
  { dispensers }: {
    dispensers: {
      source: string;
      give_remaining: number;
      satoshirate: number;
    }[];
  },
) {
  return (
    <div className="relative overflow-x-auto shadow-md max-h-96 max-w-256">
      <p class="text-[#F5F5F5] text-[26px] font-semibold">
        Dispensers ({dispensers.length})
      </p>
      <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 sm:rounded-lg">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th scope="col" className="px-6 py-3">
              Address
            </th>
            <th scope="col" className="px-6 py-3">
              Remaining
            </th>
            <th scope="col" className="px-6 py-3">
              Price (satoshis)
            </th>
          </tr>
        </thead>
        <tbody>
          {dispensers.map((dispenser) => (
            <tr
              className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700"
              key={dispenser.source}
            >
              <td className="px-6 py-4">
                {abbreviateAddress(dispenser.source)}
              </td>
              <td className="px-6 py-4 text-sm">{dispenser.give_remaining}</td>
              <td className="px-6 py-4 text-sm">{dispenser.satoshirate}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
