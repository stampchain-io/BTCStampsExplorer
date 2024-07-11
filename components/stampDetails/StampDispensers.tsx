import dayjs from "$dayjs/";
import relativeTime from "$dayjs/plugin/relativeTime";

import { short_address } from "utils/util.ts";

dayjs.extend(relativeTime);

// pending implementation and updates for dispensers data

export function StampDispensers(
  { holders }: { holders: { address: string; quantity: number }[] },
) {
  return (
    <div className="relative overflow-x-auto shadow-md max-h-96 max-w-256">
      <p class="text-[#F5F5F5] text-[26px] font-semibold">Dispensers (x10)</p>
      <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 sm:rounded-lg">
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th scope="col" className="px-6 py-3">
              Address
            </th>
            <th scope="col" className="px-6 py-3">
              Qty
            </th>
          </tr>
        </thead>
        <tbody>
          {holders.map((holder) => (
            <tr
              className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700"
              key={holder.address}
            >
              <td className="px-6 py-4">{short_address(holder.address)}</td>
              <td className="px-6 py-4 text-sm">{holder.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
