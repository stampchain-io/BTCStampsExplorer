import { useState } from "preact/hooks";
import { SRC20Row } from "globals";
import { abbreviateAddress, convertToEmoji } from "$lib/utils/util.ts";

export function HomeTable({ data = [] }: { data: SRC20Row[] }) {
  const [selectedTab, setSelectedTab] = useState("Top");

  const tabClasses = (isSelected: boolean) =>
    isSelected
      ? "text-[26px] mobile-lg:text-[40px] text-stamp-table-header cursor-pointer pb-4 border-b-4 border-stamp-purple-accent"
      : "text-[20px] mobile-lg:text-[32px] text-stamp-table-inactive cursor-pointer pb-4";

  return (
    <div>
      <div className="flex justify-between items-end border-b-2 border-stamp-purple-dark mb-5 mobile-lg:mb-10">
        <div className="flex gap-6 mobile-lg:gap-14 items-end">
          <p
            className={tabClasses(selectedTab === "Top")}
            onClick={() => setSelectedTab("Top")}
          >
            Top
          </p>
          <p
            className={tabClasses(selectedTab === "New")}
            onClick={() => setSelectedTab("New")}
          >
            New
          </p>
        </div>
        <div className="relative">
          <input
            placeholder="stamp #, CPID, wallet address..."
            className="block mobile-lg:hidden min-w-[270px] h-[54px] bg-stamp-purple-dark px-3 mobile-lg:px-6 py-5 text-sm text-stamp-table-placeholder mb-4"
          />
          <input
            placeholder="stamp #, CPID, wallet address, tx_hash"
            className="hidden mobile-lg:block min-w-[520px] h-[54px] bg-stamp-purple-dark px-3 mobile-lg:px-6 py-5 text-sm text-stamp-table-placeholder mb-4"
          />
          <img
            src="/img/icon_search.svg"
            alt="Search icon"
            className="absolute top-4 right-3"
          />
        </div>
      </div>
      <div className="overflow-auto">
        <table className="overflow-auto text-sm text-left rtl:text-right text-stamp-table-text w-full">
          <thead className="text-xl">
            <tr>
              {["#", "Name", "Supply", "Kind", "Floor", "24h Volume", "Creator"]
                .map((header) => (
                  <th
                    key={header}
                    scope="col"
                    className="px-3 mobile-lg:px-6 py-1 mobile-lg:py-3"
                  >
                    {header}
                  </th>
                ))}
            </tr>
          </thead>
          <tbody className="text-lg">
            {data.map((src20: SRC20Row) => {
              const href = `/src20/${convertToEmoji(src20.tick)}`;
              return (
                <tr key={src20.row_num}>
                  <td className="px-3 mobile-lg:px-6 py-2 mobile-lg:py-4 uppercase">
                    {src20.row_num}
                  </td>
                  <td className="px-3 mobile-lg:px-6 py-2 mobile-lg:py-4 uppercase">
                    <a href={href}>{convertToEmoji(src20.tick)}</a>
                  </td>
                  <td className="px-3 mobile-lg:px-6 py-2 mobile-lg:py-4">
                    {Number(src20.max).toLocaleString()}
                  </td>
                  <td className="px-3 mobile-lg:px-6 py-2 mobile-lg:py-4">
                    STAMP
                  </td>
                  <td className="px-3 mobile-lg:px-6 py-2 mobile-lg:py-4">
                    0.012 BTC
                  </td>
                  <td className="px-3 mobile-lg:px-6 py-2 mobile-lg:py-4">
                    12 BTC
                  </td>
                  <td className="px-3 mobile-lg:px-6 py-2 mobile-lg:py-4">
                    {src20.destination_name ??
                      abbreviateAddress(src20.destination)}
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
