import dayjs from "$dayjs/";
import relativeTime from "$dayjs/plugin/relativeTime";

import { abbreviateAddress } from "utils/util.ts";

dayjs.extend(relativeTime);

// pending implementation and updates for dispensers data

export function StampHolders(
  { holders }: { holders: { address: string; quantity: number }[] },
) {
  return (
    <div className="relative overflow-x-auto shadow-md sm:rounded-lg max-h-96 max-w-256">
      <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
        <caption className="p-5 text-lg font-semibold text-left rtl:text-right text-gray-900 bg-white dark:text-white dark:bg-gray-800">
          HOLDERS
        </caption>
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
              <td className="px-6 py-4">{abbreviateAddress(holder.address)}</td>
              <td className="px-6 py-4 text-sm">{holder.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
