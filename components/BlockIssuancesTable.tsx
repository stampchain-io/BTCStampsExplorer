import dayjs from "$dayjs/";
import relativeTime from "$dayjs/plugin/relativeTime";

import Stamp from "$/components/Stamp.tsx";
import { StampKind } from "$/components/StampKind.tsx";

import { abbreviateAddress } from "$lib/utils/util.ts";
import { BlockInfo, SendRow, StampRow } from "globals";

dayjs.extend(relativeTime);

interface BlockIssuancesTableProps {
  block: {
    block_info: BlockInfo;
    issuances: StampRow[];
    sends: SendRow[];
  };
}

export default function BlockIssuancesTable(props: BlockIssuancesTableProps) {
  const { block_info, issuances } = props.block;

  return (
    <div className="relative overflow-x-auto shadow-md sm:rounded-lg max-h-196">
      <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400 sm:h-auto">
        <thead className="bg-[#343434] uppercase text-xs text-gray-700 dark:text-gray-400">
          <tr>
            <th scope="col" className="px-6 py-3">Image</th>
            <th scope="col" className="px-6 py-3">Stamp</th>
            <th scope="col" className="px-6 py-3">Kind</th>
            <th scope="col" className="px-6 py-3">cpid</th>
            <th scope="col" className="px-6 py-3">Creator</th>
            {/* <th scope="col" className="px-6 py-3">Divisible</th> */}
            {/* <th scope="col" className="px-6 py-3">Locked</th> */}
            <th scope="col" className="px-6 py-3">Supply</th>
            {/* <th scope="col" className="px-6 py-3">Keyburn</th> */}
            <th scope="col" className="px-6 py-3">Timestamp</th>
            {/* <th scope="col" className="px-6 py-3">is_reissuance</th> */}
          </tr>
        </thead>
        <tbody>
          {issuances.map((issuance: StampRow) => {
            const kind = issuance.is_btc_stamp
              ? "stamp"
              : issuance.cpid.startsWith("A")
              ? "cursed"
              : "named";
            return (
              <tr className="bg-[#262424] border-b dark:border-gray-700">
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
                {
                  /* <td className="px-6 py-4 text-sm">
                  {issuance.divisible ? "true" : "false"}
                </td> */
                }
                {
                  /* <td className="px-6 py-4 text-sm">
                  {issuance.locked ? "true" : "false"}
                </td> */
                }

                <td className="px-6 py-4 text-sm">
                  {issuance.supply
                    ? issuance.supply.toLocaleString(undefined, {
                      maximumFractionDigits: 0,
                    })
                    : "N/A"}
                </td>
                {
                  /* <td className="px-6 py-4 text-sm">
                  {issuance.keyburn ? "true" : "false"}
                </td> */
                }
                <td className="px-6 py-4 text-sm">
                  {dayjs(Number(block_info.block_time)).fromNow()}
                </td>
                {
                  /* <td className="px-6 py-4 text-sm">
                  {issuance.is_reissue ? "true" : "false"}
                </td> */
                }
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
