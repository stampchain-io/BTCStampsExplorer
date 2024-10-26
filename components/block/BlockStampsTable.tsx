import dayjs from "$dayjs/";
import relativeTime from "$dayjs/plugin/relativeTime";

import { StampKind } from "$components/StampKind.tsx";

import Stamp from "$islands/stamp/details/StampImage.tsx";

import { abbreviateAddress } from "$lib/utils/util.ts";
import { BlockInfo, StampRow } from "globals";

dayjs.extend(relativeTime);

interface BlockStampsTableProps {
  block: BlockInfo;
}

export default function BlockStampsTable(props: BlockStampsTableProps) {
  const { block_info, issuances } = props.block;

  return (
    <div className="relative overflow-x-auto shadow-md max-h-196">
      <table className="hidden md:table w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 sm:h-auto">
        <thead className="bg-[#2B0E49] uppercase text-lg text-[#C184FF] border-b border-[#B9B9B9]">
          <tr>
            <th scope="col" className="px-6 py-3">#</th>
            <th scope="col" className="px-6 py-3">Image</th>
            <th scope="col" className="px-6 py-3">Stamp</th>
            <th scope="col" className="px-6 py-3">Kind</th>
            <th scope="col" className="px-6 py-3">cpid</th>
            <th scope="col" className="px-6 py-3">Creator</th>
            <th scope="col" className="px-6 py-3">Supply</th>
            <th scope="col" className="px-6 py-3">Timestamp</th>
          </tr>
        </thead>
        <tbody className="text-[#F5F5F5]">
          {issuances.map((issuance: StampRow, index: number) => {
            const kind = issuance.is_btc_stamp
              ? "stamp"
              : issuance.cpid.startsWith("A")
              ? "cursed"
              : "named";
            return (
              <tr className="bg-[#2B0E49] border-b border-[#B9B9B9]">
                <td className="px-6 py-4">{index + 1}</td>
                <td className="px-0.5 py-0.5">
                  <a href={`/stamp/${issuance.cpid}`}>
                    <Stamp
                      stamp={issuance}
                      className="w-20 h-20 object-contain"
                    />
                  </a>
                </td>
                <td className="px-6 py-4">
                  <a href={`/stamp/${issuance.stamp}`}>
                    {issuance.stamp}
                  </a>
                </td>
                <td className="px-6 py-4 text-sm">
                  <StampKind kind={kind} />
                </td>
                <td className="px-6 py-4 text-sm">
                  <a href={`/stamp/${issuance.cpid}`}>
                    {issuance.cpid}
                  </a>
                </td>
                <td className="px-6 py-4 text-sm">
                  <a href={`/wallet/${issuance.creator}`}>
                    {issuance.creator_name ??
                      abbreviateAddress(issuance.creator)}
                  </a>
                </td>
                <td className="px-6 py-4 text-sm">
                  {issuance.supply
                    ? issuance.supply.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })
                    : "N/A"}
                </td>
                <td className="px-6 py-4 text-sm">
                  {dayjs(Number(block_info.block_time)).fromNow()}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div class="flex md:hidden flex-col gap-3">
        {issuances.map((issuance: StampRow, _index: number) => {
          const kind = issuance.is_btc_stamp
            ? "stamp"
            : issuance.cpid.startsWith("A")
            ? "cursed"
            : "named";
          return (
            <div className="text-[#F5F5F5] bg-[#2B0E49] border-2 border-[#3F2A4E] p-2">
              <div className="flex justify-between mb-4">
                <div className="flex gap-2">
                  <a href={`/stamp/${issuance.cpid}`}>
                    <Stamp
                      stamp={issuance}
                      className="w-20 h-20 object-contain"
                    />
                  </a>
                  <div className="flex flex-col justify-between">
                    <div className="flex gap-2">
                      <a href={`/stamp/${issuance.stamp}`}>
                        {issuance.stamp}
                      </a>
                      <StampKind kind={kind} />
                    </div>
                    {issuance.supply
                      ? "Supply: " + issuance.supply.toLocaleString(undefined, {
                        maximumFractionDigits: 0,
                      })
                      : "N/A"}
                  </div>
                </div>
                {dayjs(Number(block_info.block_time)).fromNow()}
              </div>
              <div className="flex justify-between text-lg">
                <div>
                  <p>CPID:</p>
                  <a href={`/stamp/${issuance.cpid}`}>
                    {issuance.cpid}
                  </a>
                </div>
                <div>
                  <p>Creator:</p>
                  <a href={`/wallet/${issuance.creator}`}>
                    {issuance.creator_name ??
                      abbreviateAddress(issuance.creator)}
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
