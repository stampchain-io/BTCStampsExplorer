import {
  generateColGroup,
  getCellAlignment,
  row,
  tableLabel,
  tableValue,
} from "$components/shared/TableStyles.ts";
import { abbreviateAddress, formatDate } from "$lib/utils/formatUtils.ts";
import { ScrollContainer } from "$components/shared/ScrollContainer.tsx";
import { SRC20Row } from "$globals";

interface TokenMintsProps {
  mints: SRC20Row[];
}

export function TokenMints({ mints }: TokenMintsProps) {
  const headers = ["AMOUNT", "ADDRESS", "DATE", "TX HASH", "BLOCK"];

  return (
    <div class="relative w-full">
      <ScrollContainer>
        <div class="w-[500px] min-[500px]:w-full">
          <table class={tableValue}>
            <colgroup>
              {generateColGroup().map((col) => (
                <col key={col.key} className={col.className} />
              ))}
            </colgroup>
            <thead>
              <tr>
                {headers.map((header, i) => (
                  <th
                    key={i}
                    class={`${tableLabel} ${
                      getCellAlignment(i, headers.length)
                    }`}
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {mints?.map((mint) => (
                <tr key={mint.tx_hash} class={row}>
                  <td class={getCellAlignment(0, headers.length)}>
                    {mint.amt}
                  </td>
                  <td class={getCellAlignment(1, headers.length)}>
                    <a
                      href={`/wallet/${mint.destination}`}
                      onClick={(e) => {
                        e.preventDefault();
                        globalThis.location.href =
                          `/wallet/${mint.destination}`;
                      }}
                      className="hover:text-stamp-purple-bright cursor-pointer"
                    >
                      <span class="tablet:hidden">
                        {abbreviateAddress(mint.destination, 4)}
                      </span>
                      <span class="hidden tablet:inline">
                        {abbreviateAddress(mint.destination, 8)}
                      </span>
                    </a>
                  </td>
                  <td class={getCellAlignment(2, headers.length)}>
                    {formatDate(new Date(mint.block_time))}
                  </td>
                  <td class={getCellAlignment(3, headers.length)}>
                    <span class="tablet:hidden">
                      {abbreviateAddress(mint.tx_hash, 4)}
                    </span>
                    <span class="hidden tablet:inline">
                      {abbreviateAddress(mint.tx_hash, 8)}
                    </span>
                  </td>
                  <td class={getCellAlignment(4, headers.length)}>
                    {mint.block_index}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ScrollContainer>
    </div>
  );
}
