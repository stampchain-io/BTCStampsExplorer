import { short_address } from "$lib/utils/util.ts";
import dayjs from "$dayjs/";
import { SendRow } from "globals";

/**
 * Renders a table displaying the stamp sends activity.
 *
 * @param sends - An array of `SendRow` objects representing the stamp sends.
 * @returns The rendered StampSends component.
 */
export function StampSends({ sends }: { sends: SendRow[] }) {
  return (
    <div className="relative overflow-x-auto shadow-md max-h-96 max-w-256">
      <p class="text-[#F5F5F5] text-[26px] font-semibold">Transfers</p>
      <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 sm:rounded-lg">
        <thead className="text-lg font-bold text-[#C184FF] uppercase bg-[#2B0E49]">
          <tr>
            <th scope="col" className="px-6 py-3">From</th>
            <th scope="col" className="px-6 py-3">To</th>
            <th scope="col" className="px-6 py-3">Qty</th>
            {/* <th scope="col" className="px-6 py-3">Unit Price</th> */}
            <th scope="col" className="px-6 py-3">Memo</th>
            <th scope="col" className="px-6 py-3">Tx hash</th>
            <th scope="col" className="px-6 py-3">Created</th>
          </tr>
        </thead>
        <tbody>
          {sends.map((send: SendRow) => {
            const kind = send.is_btc_stamp
              ? "stamp"
              : (send.cpid && send.cpid.startsWith("A"))
              ? "cursed"
              : "named";

            return (
              <tr
                className="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700"
                key={send.tx_hash}
              >
                <td className="px-6 py-4">
                  {send.source ? short_address(send.source) : "NULL"}
                </td>
                <td className="px-6 py-4">
                  {send.destination ? short_address(send.destination) : "NULL"}
                </td>
                <td className="px-6 py-4 text-sm">{send.quantity}</td>
                {
                  /* <td className="px-6 py-4 text-sm">
                  {send.satoshirate
                    ? `${send.satoshirate / 100000000} BTC`
                    : "0 BTC"}
                </td> */
                }
                <td className="px-6 py-4 text-sm">{send.memo || "transfer"}</td>
                <td className="px-6 py-4 text-sm">
                  {short_address(send.tx_hash)}
                </td>
                <td className="px-6 py-4 text-sm">
                  {dayjs(Number(send.block_time)).fromNow()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
