import { useState } from "preact/hooks";
import { SRC20Row } from "globals";
import { abbreviateAddress, convertToEmoji } from "$lib/utils/util.ts";

export function HomeTable({ data = [] }: { data: SRC20Row[] }) {
  const [selectedTab, setSelectedTab] = useState("Top");

  return (
    <div>
      <div class="flex justify-between items-end border-b-2 border-[#3F2A4E] mb-5 md:mb-10">
        <div class="flex gap-6 md:gap-14 items-end">
          <p
            class={selectedTab === "Top"
              ? "text-[26px] md:text-[40px] text-[#F5F5F5] cursor-pointer pb-4 border-b-4 border-b-[#7A00F5]"
              : "text-[20px] md:text-[32px] text-[#B9B9B9] cursor-pointer pb-4"}
            onClick={() => setSelectedTab("Top")}
          >
            Top
          </p>
          <p
            class={selectedTab === "New"
              ? "text-[26px] md:text-[40px] text-[#F5F5F5] cursor-pointer pb-4 border-b-4 border-b-[#7A00F5]"
              : "text-[20px] md:text-[32px] text-[#B9B9B9] cursor-pointer pb-4"}
            onClick={() => setSelectedTab("New")}
          >
            New
          </p>
        </div>
        <div class="relative">
          <input
            placeholder="stamp #, CPID, wallet address..."
            class="block md:hidden min-w-[270px] h-[54px] bg-[#3F2A4E] px-3 md:px-6 py-5 text-sm text-[#8D9199] mb-4"
          >
          </input>
          <input
            placeholder="stamp #, CPID, wallet address, tx_hash"
            class="hidden md:block min-w-[520px] h-[54px] bg-[#3F2A4E] px-3 md:px-6 py-5 text-sm text-[#8D9199] mb-4"
          >
          </input>
          <img
            src="/img/icon_search.svg"
            alt="Search icon"
            class="absolute top-4 right-3"
          />
        </div>
      </div>
      <div class="overflow-auto">
        <table class="overflow-auto text-sm text-left rtl:text-right text-[#DBDBDB] w-full">
          <thead class="text-xl">
            <tr>
              <th scope="col" class="px-3 md:px-6 py-1 md:py-3">#</th>
              <th scope="col" class="px-3 md:px-6 py-1 md:py-3">Name</th>
              <th scope="col" class="px-3 md:px-6 py-1 md:py-3">Supply</th>
              <th scope="col" class="px-3 md:px-6 py-1 md:py-3">Kind</th>
              <th scope="col" class="px-3 md:px-6 py-1 md:py-3">Floor</th>
              <th scope="col" class="px-3 md:px-6 py-1 md:py-3">24h Volume</th>
              <th scope="col" class="px-3 md:px-6 py-1 md:py-3">Creator</th>
            </tr>
          </thead>
          <tbody class="text-lg">
            {/* this is intended to pull both src-20 and stamps */}
            {data.map((src20: SRC20Row) => {
              const href = `/src20/${convertToEmoji(src20.tick)}`;
              return (
                <tr>
                  <td class="px-3 md:px-6 py-2 md:py-4 uppercase">
                    {src20.row_num}
                  </td>
                  <td class="px-3 md:px-6 py-2 md:py-4 uppercase">
                    <a href={href}>
                      {convertToEmoji(src20.tick)}
                    </a>
                  </td>
                  <td class="px-3 md:px-6 py-2 md:py-4">
                    {typeof src20.max === "number"
                      ? src20.max.toLocaleString()
                      : Number(src20.max).toLocaleString()}
                  </td>
                  <td class="px-3 md:px-6 py-2 md:py-4">
                    STAMP
                  </td>
                  <td class="px-3 md:px-6 py-2 md:py-4">
                    0.012 BTC
                  </td>
                  <td class="px-3 md:px-6 py-2 md:py-4">
                    12 BTC
                  </td>
                  <td class="px-3 md:px-6 py-2 md:py-4">
                    {src20.destination_name
                      ? src20.destination_name
                      : abbreviateAddress(src20.destination)}
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
