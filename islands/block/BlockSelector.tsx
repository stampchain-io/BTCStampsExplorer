import type { Signal } from "@preact/signals";
import dayjs from "$dayjs/";
import relativeTime from "$dayjs/plugin/relativeTime";

import { abbreviateAddress } from "$lib/utils/util.ts";
import { BlockRow } from "globals";

dayjs.extend(relativeTime);

interface BlockProps {
  block: BlockRow;
  selected: Signal<BlockRow>;
}
export default function BlockSelector(props: BlockProps) {
  const { block, selected } = props;
  function handleClick() {
    selected.value = block;
  }

  const isSelected = selected.value === block;
  const displayAddress = globalThis.innerWidth >= 640
    ? abbreviateAddress(block.block_hash, 8)
    : abbreviateAddress(block.block_hash, 16);

  return (
    <a
      href={`/block/${block.block_index}`}
      class={`${
        isSelected ? "bg-blue-100 text-gray-800" : "bg-gray-800 text-blue-100"
      } transition-all transform hover:shadow-xl
        rounded-lg overflow-hidden flex flex-col justify-between p-3 mobileLg:p-4 m-2
        cursor-pointer hover:bg-gray-700 hover:text-blue-200`}
      onClick={handleClick}
    >
      <div class="flex items-center justify-between text-sm mobileLg:text-base">
        <h3 class="font-bold">Block {block.block_index}</h3>
        <span>{dayjs(block.block_time).fromNow()}</span>
      </div>
      <div class="mt-1 mb-2">
        <p class="truncate">{displayAddress}</p>
      </div>
      <div class="flex items-center justify-between text-xs mobileLg:text-sm">
        <span>Stamps: {block.issuances}</span>
        {/* <span>Sends: {block.sends}</span> */}
      </div>
    </a>
  );
}
