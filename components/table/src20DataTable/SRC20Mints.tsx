import { SRC20Row } from "$globals";
import { abbreviateAddress, formatDate } from "$lib/utils/formatUtils.ts";
import { cellAlign, colGroup } from "$components/layout/types.ts";
import { rowTable } from "$layout";
import { labelXs, valueDark, valueSm, valueSmLink } from "$text";

interface SRC20MintsProps {
  mints: SRC20Row[];
}

export function SRC20MintsTable({ mints }: SRC20MintsProps) {
  const headers = ["AMOUNT", "ADDRESS", "DATE", "TX HASH", "BLOCK"];

  return (
    <div class="w-[500px] min-[500px]:w-full">
      <table class={valueSm}>
        <colgroup>
          {colGroup().map((col) => (
            <col key={col.key} className={col.className} />
          ))}
        </colgroup>
        {mints.length > 0 && (
          <thead>
            <tr>
              {headers.map((header, i) => (
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
          {mints?.length
            ? mints?.map((mint) => (
              <tr key={mint.tx_hash} class={rowTable}>
                <td class={cellAlign(0, headers.length)}>
                  {mint.amt}
                </td>
                <td class={cellAlign(1, headers.length)}>
                  <a
                    href={`/wallet/${mint.destination}`}
                    onClick={(e) => {
                      e.preventDefault();
                      globalThis.location.href = `/wallet/${mint.destination}`;
                    }}
                    className={valueSmLink}
                  >
                    <span class="tablet:hidden">
                      {abbreviateAddress(mint.destination, 4)}
                    </span>
                    <span class="hidden tablet:inline">
                      {abbreviateAddress(mint.destination, 8)}
                    </span>
                  </a>
                </td>
                <td class={cellAlign(2, headers.length)}>
                  {formatDate(new Date(mint.block_time))}
                </td>
                <td class={cellAlign(3, headers.length)}>
                  <a
                    href={`https://www.blockchain.com/explorer/transactions/btc/${mint.tx_hash}`}
                    target="_blank"
                    onClick={(e) => {
                      e.preventDefault();
                      globalThis.open(
                        `https://www.blockchain.com/explorer/transactions/btc/${mint.tx_hash}`,
                        "_blank",
                      );
                    }}
                    className={valueSmLink}
                  >
                    <span class="tablet:hidden">
                      {abbreviateAddress(mint.tx_hash, 4)}
                    </span>
                    <span class="hidden tablet:inline">
                      {abbreviateAddress(mint.tx_hash, 8)}
                    </span>
                  </a>
                </td>
                <td class={cellAlign(4, headers.length)}>
                  {mint.block_index}
                </td>
              </tr>
            ))
            : (
              <tr>
                <td
                  class={`${valueDark} w-full`}
                >
                  NO MINTS YET
                </td>
              </tr>
            )}
        </tbody>
      </table>
    </div>
  );
}
