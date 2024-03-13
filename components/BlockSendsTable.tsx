import dayjs from "$dayjs/";
import relativeTime from "$dayjs/plugin/relativeTime";

import { short_address } from "$lib/utils/util.ts";
import Stamp from "$/components/Stamp.tsx";
import { StampKind } from "$/components/StampKind.tsx";
import { BlockInfo, SendRow, StampRow } from "globals";
dayjs.extend(relativeTime);

interface BlockSendsTableProps {
  block: {
    block_info: BlockInfo;
    issuances: StampRow[];
    sends: SendRow[];
  };
}

export default function BlockSendsTable(props: BlockSendsTableProps) {
  const { block_info, sends } = props.block;

  // this will likely be easier just looking at the dispenser when showing the dispense
  // const fetchSatoshirate = async (txHash: string, source: string) => {
  //   try {
  //     const satoshirate = await fetchPricefromBlockCypherAPI(txHash, source);
  //     return satoshirate;
  //   } catch (error) {
  //     console.error("Error fetching satoshirate:", error);
  //     return null;
  //   }
  // };

  return (
    <div class="relative overflow-x-auto shadow-md sm:rounded-lg max-h-96">
      <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
        <caption class="p-5 text-lg font-semibold text-left rtl:text-right text-gray-900 bg-white dark:text-white dark:bg-gray-800">
          Sends
        </caption>
        <thead class="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
          <tr>
            <th scope="col" class="px-6 py-3">Image</th>
            <th scope="col" class="px-6 py-3">Stamp</th>
            <th scope="col" class="px-6 py-3">Kind</th>
            <th scope="col" class="px-6 py-3">From</th>
            <th scope="col" class="px-6 py-3">To</th>
            <th scope="col" class="px-6 py-3">ID</th>
            <th scope="col" class="px-6 py-3">Tick</th>
            <th scope="col" class="px-6 py-3">Qty</th>
            <th scope="col" class="px-6 py-3">Unit Price</th>
            <th scope="col" class="px-6 py-3">Memo</th>
            <th scope="col" class="px-6 py-3">Tx hash</th>
            <th scope="col" class="px-6 py-3">Tx index</th>
            <th scope="col" class="px-6 py-3">Created</th>
          </tr>
        </thead>
        <tbody>
          {sends.map((send: SendRow) => {
            const kind = send.is_btc_stamp
              ? "stamp"
              : send.cpid.startsWith("A")
              ? "cursed"
              : "named";

            // const satoshirate = await fetchSatoshirate(
            //   send.tx_hash,
            //   send.source,
            // );

            return (
              <tr class="odd:bg-white odd:dark:bg-gray-900 even:bg-gray-50 even:dark:bg-gray-800 border-b dark:border-gray-700">
                <td class="px-0.5 py-0.5">
                  <a href={`/stamp/${send.cpid}`}>
                    <Stamp stamp={send} className="" />
                  </a>
                </td>
                <td class="px-6 py-4">
                  {send.stamp}
                </td>
                <td class="px-6 py-4">
                  <StampKind kind={kind} />
                </td>
                <td class="px-6 py-4">
                  {send.source ? short_address(send.source) : "NULL"}
                </td>
                <td class="px-6 py-4">
                  {send.destination ? short_address(send.destination) : "NULL"}
                </td>
                <td class="px-6 py-4 text-sm">
                  <a href={`/stamp/${send.cpid}`}>
                    {send.cpid}
                  </a>
                </td>
                <td class="px-6 py-4 text-sm">
                  {send.tick ? send.tick : "NULL"}
                </td>
                <td class="px-6 py-4 text-sm">{send.quantity}</td>
                <td class="px-6 py-4 text-sm">
                  {send.satoshirate
                    ? `${send.satoshirate / 100000000} BTC`
                    : "0 BTC"}
                </td>
                <td class="px-6 py-4 text-sm">{send.memo}</td>
                <td class="px-6 py-4 text-sm">{short_address(send.tx_hash)}</td>
                <td class="px-6 py-4 text-sm">{send.tx_index}</td>
                <td class="px-6 py-4 text-sm">
                  {dayjs(Number(block_info.block_time)).fromNow()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
