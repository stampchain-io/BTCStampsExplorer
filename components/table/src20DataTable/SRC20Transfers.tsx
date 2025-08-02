import { cellAlign, colGroup } from "$components/layout/types.ts";
import type { SRC20TransfersProps } from "$types/ui.d.ts";
import type { SRC20Row } from "$types/src20.d.ts";
import { rowTable } from "$layout";
import {
  abbreviateAddress,
  formatDate,
} from "$lib/utils/ui/formatting/formatUtils.ts";
import { labelXs, valueDark, valueSm, valueSmLink } from "$text";

export function SRC20TransfersTable({ sends }: SRC20TransfersProps) {
  const headers = ["FROM", "TO", "AMOUNT", "DATE", "TX HASH"];

  return (
    <div class="w-[660px] min-[660px]:w-full">
      <table class={`${valueSm} w-full`}>
        <colgroup>
          {colGroup().map((col: any) => (
            <col key={col.key} class={col.className} />
          ))}
        </colgroup>
        {sends?.length > 0 &&
          (
            <thead>
              <tr>
                {headers.map((header: string, i: number) => (
                  <th
                    key={i}
                    class={`${labelXs} pb-1.5 ${cellAlign(i, headers.length)}`}
                  >
                    {header}
                  </th>
                ))}
                <th class="min-w-3 min-[660px]:hidden block" />
              </tr>
            </thead>
          )}
        <tbody>
          {sends?.length
            ? sends?.map((send: SRC20Row) => (
              <tr key={send.tx_hash} class={rowTable}>
                <td class={cellAlign(0, headers.length)}>
                  <a
                    href={`/wallet/${send.creator}`}
                    className={valueSmLink}
                  >
                    <span class="tablet:hidden">
                      {abbreviateAddress(send.creator, 4)}
                    </span>
                    <span class="hidden tablet:inline">
                      {abbreviateAddress(send.creator, 8)}
                    </span>
                  </a>
                </td>
                <td class={cellAlign(1, headers.length)}>
                  <a
                    href={`/wallet/${send.destination}`}
                    className={valueSmLink}
                  >
                    <span class="tablet:hidden">
                      {abbreviateAddress(send.destination, 4)}
                    </span>
                    <span class="hidden tablet:inline">
                      {abbreviateAddress(send.destination, 8)}
                    </span>
                  </a>
                </td>
                <td class={cellAlign(2, headers.length)}>
                  {send.amt}
                </td>
                <td class={cellAlign(3, headers.length)}>
                  {formatDate(new Date(send.block_time))}
                </td>
                <td class={cellAlign(4, headers.length)}>
                  <a
                    href={`https://www.blockchain.com/explorer/transactions/btc/${send.tx_hash}`}
                    target="_blank"
                    onClick={(e) => {
                      e.preventDefault();
                      globalThis.open(
                        `https://www.blockchain.com/explorer/transactions/btc/${send.tx_hash}`,
                        "_blank",
                      );
                    }}
                    className={valueSmLink}
                  >
                    <span class="tablet:hidden">
                      {abbreviateAddress(send.tx_hash, 4)}
                    </span>
                    <span class="hidden tablet:inline">
                      {abbreviateAddress(send.tx_hash, 8)}
                    </span>
                  </a>
                </td>
              </tr>
            ))
            : (
              <tr>
                <td
                  class={`${valueDark} w-full`}
                >
                  NO TRANSFERS
                </td>
              </tr>
            )}
        </tbody>
      </table>
    </div>
  );
}
