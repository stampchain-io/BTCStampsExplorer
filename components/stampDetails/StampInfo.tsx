import dayjs from "$dayjs/";
import relativeTime from "$dayjs/plugin/relativeTime";

import { abbreviateAddress } from "utils/util.ts";

import { StampRow } from "globals";

dayjs.extend(relativeTime);

export function StampInfo({ stamp }: { stamp: StampRow }) {
  const timestamp = new Date(stamp.block_time);
  const kind = stamp.is_btc_stamp
    ? "stamp"
    : stamp.cpid.startsWith("A")
    ? "cursed"
    : "named";
  return (
    <div class="flex flex-col text-gray-200 bg-[#2B0E49]">
      <div class="flex items-center truncate text-[#C184FF] text-5xl p-6 pb-0">
        <p>
          Stamp: #{stamp.stamp}
        </p>
        {/* <StampKind kind={kind} /> */}
      </div>
      <div class="flex flex-col gap-1 truncate border-b border-[#60626F] text-[#F5F5F5] px-6 py-4">
        <p class="text-xl font-semibold">Counter party ID</p>
        <a
          href={`https://xcp.dev/asset/${stamp.cpid}`}
          target="_blank"
          rel="noopener noreferrer"
          class="text-[#60626F]"
        >
          {stamp.cpid}
        </a>
      </div>
      <div class="flex justify-between items-end gap-1 truncate border-b border-[#60626F] text-[#F5F5F5] px-6 py-4">
        <div className="flex flex-col">
          <p class="text-xl font-semibold">Creator</p>
          <p class="text-[#60626F]">
            {stamp.creator_name
              ? stamp.creator_name
              : (
                <a href={`/wallet/${stamp.creator}`}>
                  {abbreviateAddress(stamp.creator, 12)}
                </a>
              )}
          </p>
        </div>
        <img
          src="/img/icon_copy_to_clipboard.png"
          className="w-4 h-5 cursor-pointer"
        />
      </div>
      <div class="flex justify-between items-end gap-1 truncate border-b border-[#60626F] text-[#F5F5F5] px-6 py-4">
        <div className="flex flex-col">
          <p class="text-xl font-semibold">Block #</p>
          <p class="text-[#60626F]">832124</p>
        </div>
        <img
          src="/img/icon_copy_to_clipboard.png"
          className="w-4 h-5 cursor-pointer"
        />
      </div>
      <div class="flex justify-between items-end gap-1 truncate border-b border-[#60626F] text-[#F5F5F5] px-6 py-4">
        <div className="flex flex-col">
          <p class="text-xl font-semibold">TX hash</p>
          <a
            href={`https://www.blockchain.com/explorer/transactions/btc/${stamp.tx_hash}`}
            target="_blank"
            rel="noopener noreferrer"
            class="text-[#60626F]"
          >
            {abbreviateAddress(stamp.tx_hash, 12)}
          </a>
        </div>
        <img
          src="/img/icon_copy_to_clipboard.png"
          className="w-4 h-5 cursor-pointer"
        />
      </div>
      <div class="flex flex-col gap-1 truncate border-b border-[#60626F] text-[#F5F5F5] px-6 py-4">
        <p class="text-xl font-semibold">Supply</p>
        <p class="text-[#60626F]">
          {stamp.divisible
            ? (stamp.supply / 100000000).toFixed(2)
            : stamp.supply > 100000
            ? "+100000"
            : stamp.supply}
        </p>
      </div>
      <div class="flex flex-col gap-1 truncate border-b border-[#60626F] text-[#F5F5F5] px-6 py-4">
        <p class="text-xl font-semibold">Locked</p>
        <p class="text-[#60626F]">Yes</p>
      </div>
      <div class="flex flex-col gap-1 truncate border-b border-[#60626F] text-[#F5F5F5] px-6 py-4">
        <p class="text-xl font-semibold">Divisible</p>
        <p class="text-[#60626F]">No</p>
      </div>
      <div class="flex flex-col gap-1 truncate border-b border-[#60626F] text-[#F5F5F5] px-6 py-4">
        <p class="text-xl font-semibold">Keyburned</p>
        <p class="text-[#60626F]">No</p>
      </div>
      <div class="flex flex-col gap-1 truncate border-b border-[#60626F] text-[#F5F5F5] px-6 py-4">
        <p class="text-xl font-semibold">Burned/destroyed</p>
        <p class="text-[#60626F]">840612</p>
      </div>
      <div class="flex flex-col gap-1 truncate text-[#F5F5F5] px-6 py-4">
        <p class="text-xl font-semibold">Created At</p>
        <p class="text-[#60626F]">
          {timestamp.toLocaleDateString()} ({dayjs(timestamp).fromNow()})
        </p>
      </div>
    </div>
  );
}
