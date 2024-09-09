import { abbreviateAddress } from "$lib/utils/util.ts";
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
    <div className="relative shadow-md max-w-256">
      {
        /* <p class="text-[#F5F5F5] text-[26px] font-semibold">
        Transfers ({sends.length})
      </p> */
      }
      <div className="max-h-96 overflow-x-auto">
        <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 sm:rounded-lg">
          <thead className="text-lg font-bold uppercase">
            <tr>
              <th scope="col" className="pr-6 py-3">From</th>
              <th scope="col" className="px-6 py-3">To</th>
              <th scope="col" className="px-6 py-3">Qty</th>
              {/* <th scope="col" className="px-6 py-3">Unit Price</th> */}
              <th scope="col" className="px-6 py-3">Memo</th>
              <th scope="col" className="px-6 py-3">Tx hash</th>
              <th scope="col" className="pl-6 py-3">Created</th>
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
                  key={send.tx_hash}
                >
                  <td className="pr-6 py-4">
                    {send.source ? abbreviateAddress(send.source) : "NULL"}
                  </td>
                  <td className="px-6 py-4">
                    {send.destination
                      ? abbreviateAddress(send.destination)
                      : "NULL"}
                  </td>
                  <td className="px-6 py-4 text-sm">{send.quantity}</td>
                  {
                    /* <td className="px-6 py-4 text-sm">
                  {send.satoshirate
                    ? `${send.satoshirate / 100000000} BTC`
                    : "0 BTC"}
                </td> */
                  }
                  <td className="px-6 py-4 text-sm">
                    {send.memo || "transfer"}
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {abbreviateAddress(send.tx_hash)}
                  </td>
                  <td className="pl-6 py-4 text-sm">
                    {dayjs(Number(send.block_time)).fromNow()}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
