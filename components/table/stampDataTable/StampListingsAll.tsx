import {
  abbreviateAddress,
  formatSatoshisToBTC,
} from "$lib/utils/formatUtils.ts";
import {
  cellAlign,
  colGroup,
  row,
  tableLabel,
  tableStatus,
  tableValue,
  tableValueLink,
} from "$table";

interface Dispenser {
  source: string;
  give_remaining: number;
  escrow_quantity: number;
  give_quantity: number;
  satoshirate: number;
  tx_hash: string;
  close_block_index: number;
}

interface StampListingsAllProps {
  dispensers: Dispenser[];
}

export function StampListingsAllTable({ dispensers }: StampListingsAllProps) {
  const headers = [
    "PRICE",
    "ESCROW",
    "GIVE",
    "REMAIN",
    "SOURCE",
    "ADDRESS",
    "STATUS",
  ];

  return (
    <div class="w-[660px] min-[660px]:w-full">
      <table class={tableValue}>
        <colgroup>
          {colGroup([
            { width: "w-[16%]" },
            { width: "w-[10%]" },
            { width: "w-[10%]" },
            { width: "w-[10%]" },
            { width: "w-[14%]" },
            { width: "w-[26%]" },
            { width: "w-[14%]" },
          ]).map((col) => <col key={col.key} className={col.className} />)}
        </colgroup>
        {dispensers.length > 0 && (
          <thead>
            <tr>
              {headers.map((header, i) => (
                <th
                  key={i}
                  class={`${tableLabel} ${cellAlign(i, headers.length)}`}
                >
                  {header}
                </th>
              ))}
              <th class="min-w-3 min-[660px]:hidden block" />
            </tr>
          </thead>
        )}
        <tbody>
          {dispensers.length
            ? dispensers?.map((dispenser, index) => {
              const isEmpty = dispenser.give_remaining === 0;
              const rowDispensersRemain = `${
                isEmpty ? "text-stamp-grey-darker" : ""
              } ${row}`;

              return (
                <tr
                  key={`${dispenser.tx_hash}-${index}`}
                  class={rowDispensersRemain}
                >
                  <td class={cellAlign(0, headers.length)}>
                    {formatSatoshisToBTC(dispenser.satoshirate)}
                  </td>
                  <td class={cellAlign(1, headers.length)}>
                    {dispenser.escrow_quantity}
                  </td>
                  <td class={cellAlign(2, headers.length)}>
                    {dispenser.give_quantity}
                  </td>
                  <td class={cellAlign(3, headers.length)}>
                    {dispenser.give_remaining}
                  </td>
                  <td class={cellAlign(4, headers.length)}>
                    DISPENSER
                  </td>
                  <td class={cellAlign(5, headers.length)}>
                    <a
                      href={`/wallet/${dispenser.source}`}
                      onClick={(e) => {
                        e.preventDefault();
                        globalThis.location.href =
                          `/wallet/${dispenser.source}`;
                      }}
                      className={`${tableValueLink} ${
                        isEmpty
                          ? "!text-stamp-grey-darker hover:!text-stamp-purple-bright"
                          : ""
                      }`}
                    >
                      <span class="tablet:hidden">
                        {abbreviateAddress(dispenser.source, 4)}
                      </span>
                      <span class="hidden tablet:inline">
                        {abbreviateAddress(dispenser.source, 8)}
                      </span>
                    </a>
                  </td>
                  <td class={cellAlign(6, headers.length)}>
                    {!dispenser.close_block_index ||
                        dispenser.close_block_index <= 0
                      ? (
                        "OPEN"
                      )
                      : (
                        <a
                          href={`https://www.blockchain.com/explorer/transactions/btc/${dispenser.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          class="hover:text-stamp-purple-bright"
                        >
                          CLOSED
                        </a>
                      )}
                  </td>
                </tr>
              );
            })
            : (
              <tr>
                <td
                  class={`${tableStatus} w-full`}
                >
                  NO LISTINGS AT THE MOMENT
                </td>
              </tr>
            )}
        </tbody>
      </table>
    </div>
  );
}
