import dayjs from "$dayjs/";
import relativeTime from "$dayjs/plugin/relativeTime";

import { abbreviateAddress } from "$lib/utils/formatUtils.ts";

dayjs.extend(relativeTime);

interface BlockHeaderTableProps {
  block: {
    block_info: BlockInfo;
    issuances: StampRow[];
    sends: SendRow[];
  };
}

export default function BlockHeaderTable(props: BlockHeaderTableProps) {
  const { block_info, issuances, sends } = props.block;

  return (
    <div class="relative overflow-x-auto shadow-md mobileLg:rounded-lg">
      <table class="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
        <tbody>
          <tr class="border-b">
            <th scope="row" class="whitespace-nowrap px-6 py-3">Block Index</th>
            <td class="whitespace-nowrap">{block_info.block_index}</td>
            <th scope="row" class="whitespace-nowrap px-6 py-3">Block Hash</th>
            <td class="whitespace-nowrap">
              {abbreviateAddress(block_info.block_hash)}
            </td>
            <th scope="row" class="px-6 py-3">Time</th>
            <td class="whitespace-nowrap">
              {dayjs(Number(block_info.block_time)).fromNow()}
            </td>
          </tr>
          <tr class="border-b">
            <th scope="row" class="whitespace-nowrap px-6 py-3">Ledger Hash</th>
            <td class="whitespace-nowrap">
              {block_info.ledger_hash
                ? abbreviateAddress(block_info.ledger_hash)
                : "null"}
            </td>
            <th scope="row" class="whitespace-nowrap px-6 py-3">Txlist Hash</th>
            <td class="whitespace-nowrap">
              {block_info.txlist_hash
                ? abbreviateAddress(block_info.txlist_hash)
                : "null"}
            </td>
            <th scope="row" class="whitespace-nowrap px-6 py-3">Txlist Hash</th>
            <td class="whitespace-nowrap">
              {block_info.messages_hash
                ? abbreviateAddress(block_info.messages_hash)
                : "null"}
            </td>
          </tr>
          <tr class="border-b">
            <th scope="row" class="px-6 py-3">Bitcoin Stamps</th>
            <td class="whitespace-nowrap">{issuances.length}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
