import dayjs from "$dayjs/";
import relativeTime from "$dayjs/plugin/relativeTime";

import { abbreviateAddress } from "utils/util.ts";

dayjs.extend(relativeTime);

export function StampHolders(
  { holders }: { holders: { address: string; quantity: number }[] },
) {
  return (
    <div className="relative shadow-md max-w-256">
      {
        /* <p class="text-[#F5F5F5] text-[26px] font-semibold">
        Holders ({holders.length})
      </p> */
      }
      {
        /* <div className={"custom-scrollbar max-h-96 overflow-x-auto"}>
        <div className="w-full min-h-96 h-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 bg-[#2B0E49] py-6 pl-7">
          <div
            className={"border border-[#B9B9B9] border-l-0 border-b-0 min-h-96 h-full"}
          >
            {holders.map((holder) => (
              <div
                className="border-b border-[#B9B9B9] flex justify-between text-[#F5F5F5] text-lg"
                key={holder.address}
              >
                <p className="pr-6 py-4">{abbreviateAddress(holder.address)}</p>
                <p className="pr-6 py-4">{holder.quantity}</p>
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
              <th scope="col" className="pr-6 py-3">
                Address
              </th>
              <th scope="col" className="pl-6 py-3">
                Qty
              </th>
            </tr>
          </thead>
          <tbody>
            {holders.map((holder) => (
              <tr
                key={holder.address}
              >
                <td className="pr-6 py-4">
                  {abbreviateAddress(holder.address)}
                </td>
                <td className="pl-6 py-4 text-sm">{holder.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
