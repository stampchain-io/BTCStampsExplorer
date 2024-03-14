export function StampSends({ sends }: { sends: SendRow[] }) {
  return (
    <div className="relative overflow-x-auto shadow-md sm:rounded-lg max-h-96 max-w-256">
      <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
        <caption className="p-5 text-lg font-semibold text-left rtl:text-right text-gray-900 bg-white dark:text-white dark:bg-gray-800">
          ACTIVITY
        </caption>
        <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
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
