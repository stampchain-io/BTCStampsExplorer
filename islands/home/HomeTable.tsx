import { SRC20Row } from "globals";
import { useState } from "preact/hooks";
import { convertToEmoji, short_address } from "utils/util.ts";

export function HomeTable({ data = [] }: { data: [] }) {
  const [selectedTab, setSelectedTab] = useState("Top");

  return (
    <div>
      <div class="flex justify-between items-end border-b-2 border-[#3F2A4E] mb-10">
        <div class="flex gap-14 items-end">
          <p
            class={selectedTab === "Top"
              ? "text-[40px] text-[#F5F5F5] cursor-pointer pb-4 border-b-4 border-b-[#7A00F5]"
              : "text-[32px] text-[#B9B9B9] cursor-pointer pb-4"}
            onClick={() => setSelectedTab("Top")}
          >
            Top
          </p>
          <p
            class={selectedTab === "New"
              ? "text-[40px] text-[#F5F5F5] cursor-pointer pb-4 border-b-4 border-b-[#7A00F5]"
              : "text-[32px] text-[#B9B9B9] cursor-pointer pb-4"}
            onClick={() => setSelectedTab("New")}
          >
            New
          </p>
        </div>
        <div class="relative">
          <input
            placeholder="stamp #, CPID, wallet address, tx_hash"
            class="min-w-[640px] h-[54px] bg-[#3F2A4E] px-6 py-5 text-sm text-[#8D9199] mb-4"
          >
          </input>
          <img
            src="/img/icon_search.svg"
            alt="Search icon"
            class="absolute top-4 right-6"
          />
        </div>
      </div>
      <div class="relative overflow-x-auto shadow-md sm:rounded-lg">
      </div>
      <table class="w-full text-sm text-left rtl:text-right text-[#DBDBDB]">
        <thead class="text-xl">
          <tr>
            <th scope="col" class="px-6 py-3">#</th>
            <th scope="col" class="px-6 py-3">Name</th>
            <th scope="col" class="px-6 py-3">Supply</th>
            <th scope="col" class="px-6 py-3">Kind</th>
            <th scope="col" class="px-6 py-3">Floor</th>
            <th scope="col" class="px-6 py-3">24h Volume</th>
            <th scope="col" class="px-6 py-3">Creator</th>
          </tr>
        </thead>
        <tbody class="text-lg">
          {data.map((src20: SRC20Row) => {
            const href = `/src20/${convertToEmoji(src20.tick)}`;
            return (
              <tr>
                <td class="px-6 py-4 uppercase">
                  {src20.row_num}
                </td>
                <td class="px-6 py-4 uppercase">
                  <a href={href}>
                    {convertToEmoji(src20.tick)}
                  </a>
                </td>
                <td class="px-6 py-4">
                  {typeof src20.max === "number"
                    ? src20.max.toLocaleString()
                    : Number(src20.max).toLocaleString()}
                </td>
                <td class="px-6 py-4">
                  STAMP
                </td>
                <td class="px-6 py-4">
                  0.012 slots
                </td>
                <td class="px-6 py-4">
                  12 slots
                </td>
                <td class="px-6 py-4">
                  {src20.destination_name
                    ? src20.destination_name
                    : short_address(src20.destination)}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
