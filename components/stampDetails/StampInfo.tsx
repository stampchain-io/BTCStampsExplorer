import dayjs from "$dayjs/";
import relativeTime from "$dayjs/plugin/relativeTime";
import { abbreviateAddress } from "utils/util.ts";

import { StampRow } from "globals";

dayjs.extend(relativeTime);

export function StampInfo({ stamp }: { stamp: StampRow }) {
  const timestamp = new Date(stamp.block_time);
  const _kind = stamp.is_btc_stamp
    ? "stamp"
    : stamp.cpid.startsWith("A")
    ? "cursed"
    : "named";
  return (
    <div class="flex flex-col text-gray-200 bg-[#2B0E49]">
      <div class="flex items-center truncate text-[#C184FF] text-2xl md:text-5xl p-6 pb-0">
        <p>
          Stamp: #{stamp.stamp}
        </p>
        {/* <StampKind kind={kind} /> */}
      </div>
      <div class="flex flex-row justify-between items-center md:flex-col md:items-start gap-1 truncate border-b border-[#60626F] text-[#F5F5F5] px-6 py-4">
        <p class="text-xl font-semibold">CPID</p>
        <a
          href={`https://xcp.dev/asset/${stamp.cpid}`}
          target="_blank"
          rel="noopener noreferrer"
          class="text-[#60626F]"
        >
          {stamp.cpid}
        </a>
      </div>
      <div class="flex flex-row justify-between items-center md:flex-col md:items-start gap-1 truncate border-b border-[#60626F] text-[#F5F5F5] px-6 py-4">
        <p class="text-xl font-semibold">Creator</p>
        <div class="flex justify-between items-center md:w-full gap-2">
          <p class="block md:hidden text-[#60626F]">
            {stamp.creator_name
              ? stamp.creator_name
              : (
                <a href={`/wallet/${stamp.creator}`}>
                  {abbreviateAddress(stamp.creator, 12)}
                </a>
              )}
          </p>
          <p class="hidden md:block text-[#60626F] overflow-hidden text-ellipsis whitespace-nowrap">
            {stamp.creator_name
              ? stamp.creator_name
              : (
                <a href={`/wallet/${stamp.creator}`}>
                  {stamp.creator}
                </a>
              )}
          </p>
          <img
            src="/img/icon_copy_to_clipboard.png"
            className="w-4 h-5 cursor-pointer"
          />
        </div>
      </div>
      <div class="flex justify-between items-end gap-1 truncate border-b border-[#60626F] text-[#F5F5F5] px-6 py-4">
        <p class="text-xl font-semibold">Created</p>
        <p class="text-[#60626F]">
          {timestamp.toLocaleDateString()} ({dayjs(timestamp).fromNow()})
        </p>
      </div>
      <div class="flex flex-row justify-between items-center md:flex-col md:items-start gap-1 truncate border-b border-[#60626F] text-[#F5F5F5] px-6 py-4">
        <p class="text-xl font-semibold">Block #</p>
        <div class="flex justify-between items-center md:w-full gap-2">
          <a
            href={`/block/${stamp.block_index}`}
            class="text-[#60626F] hover:underline"
          >
            {stamp.block_index}
          </a>
          <img
            src="/img/icon_copy_to_clipboard.png"
            className="w-4 h-5 cursor-pointer"
          />
        </div>
      </div>
      <div class="flex flex-row justify-between items-center md:flex-col md:items-start gap-1 truncate border-b border-[#60626F] text-[#F5F5F5] px-6 py-4">
        <p class="text-xl font-semibold">TX hash</p>
        <div class="flex justify-between items-center md:w-full gap-2">
          <a
            href={`https://www.blockchain.com/explorer/transactions/btc/${stamp.tx_hash}`}
            target="_blank"
            rel="noopener noreferrer"
            class="block md:hidden text-[#60626F]"
          >
            {abbreviateAddress(stamp.tx_hash, 12)}
          </a>
          <a
            href={`https://www.blockchain.com/explorer/transactions/btc/${stamp.tx_hash}`}
            target="_blank"
            rel="noopener noreferrer"
            class="hidden md:block text-[#60626F] overflow-hidden text-ellipsis whitespace-nowrap"
          >
            {stamp.tx_hash}
          </a>
          <img
            src="/img/icon_copy_to_clipboard.png"
            className="w-4 h-5 cursor-pointer"
          />
        </div>
      </div>
      <div class="flex flex-row justify-between items-center md:flex-col md:items-start gap-1 truncate border-b border-[#60626F] text-[#F5F5F5] px-6 py-4">
        <p class="text-xl font-semibold">Supply</p>
        <p class="text-[#60626F]">
          {stamp.divisible
            ? (stamp.supply / 100000000).toFixed(2)
            : stamp.supply > 100000
            ? "+100000"
            : stamp.supply}
        </p>
      </div>
      <div class="flex flex-row justify-between items-center md:flex-col md:items-start gap-1 truncate border-b border-[#60626F] text-[#F5F5F5] px-6 py-4">
        <p class="text-xl font-semibold">Locked</p>
        <p class="text-[#60626F]">{stamp.locked ?? false ? "Yes" : "No"}</p>
      </div>
      <div class="flex flex-row justify-between items-center md:flex-col md:items-start gap-1 truncate border-b border-[#60626F] text-[#F5F5F5] px-6 py-4">
        <p class="text-xl font-semibold">Divisible</p>
        <p class="text-[#60626F]">{stamp.divisible ? "Yes" : "No"}</p>
      </div>
      <div class="flex flex-row justify-between items-center md:flex-col md:items-start gap-1 truncate border-b border-[#60626F] text-[#F5F5F5] px-6 py-4">
        <p class="text-xl font-semibold">Keyburned</p>
        <p class="text-[#60626F]">{stamp.keyburn ?? false ? "Yes" : "No"}</p>
      </div>
      <div class="flex flex-row justify-between items-center md:flex-col md:items-start gap-1 truncate border-b border-[#60626F] text-[#F5F5F5] px-6 py-4">
        <p class="text-xl font-semibold">Floor Price</p>
        <p class="text-[#60626F]">
          {typeof stamp.floorPrice === "number"
            ? `${stamp.floorPrice} BTC`
            : stamp.floorPrice}
        </p>
      </div>
      <div class="flex flex-row justify-between items-center md:flex-col md:items-start gap-1 truncate border-b border-[#60626F] text-[#F5F5F5] px-6 py-4">
        <p class="text-xl font-semibold">Market Cap</p>
        <p class="text-[#60626F]">
          {typeof stamp.marketCap === "number"
            ? `${parseFloat(stamp.marketCap.toFixed(8)).toString()} BTC`
            : stamp.marketCap}
        </p>
      </div>
      <div class="flex flex-row justify-between items-center md:flex-col md:items-start gap-1 truncate border-b border-[#60626F] text-[#F5F5F5] px-6 py-4">
        <p class="text-xl font-semibold">Vault Address</p>
        <p class="text-[#60626F]">pending</p>
      </div>
    </div>
  );
}
