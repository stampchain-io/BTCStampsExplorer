import { abbreviateAddress, formatDate } from "$lib/utils/formatUtils.ts";
import { SRC20Row } from "$globals";
import {
  generateColGroup,
  row,
  tableLabel,
  tableValue,
} from "$components/shared/types.ts";
import { ScrollContainer } from "$components/shared/ScrollContainer.tsx";

interface TokenMintsProps {
  mints: SRC20Row[];
}

export function TokenMints({ mints }: TokenMintsProps) {
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
                <th class={`${tableLabel} text-left`}>AMOUNT</th>
                <th class={`${tableLabel} text-center`}>ADDRESS</th>
                <th class={`${tableLabel} text-center`}>DATE</th>
                <th class={`${tableLabel} text-center`}>TX HASH</th>
                <th class={`${tableLabel} text-right`}>BLOCK</th>
              </tr>
            </thead>
            <tbody>
              {mints?.map((mint) => (
                <tr key={mint.tx_hash} class={row}>
                  <td class="text-left">{mint.amt}</td>
                  <td class="text-center">
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
                  <td class="text-center">
                    {formatDate(new Date(mint.block_time))}
                  </td>
                  <td class="text-center">
                    <span class="tablet:hidden">
                      {abbreviateAddress(mint.tx_hash, 4)}
                    </span>
                    <span class="hidden tablet:inline">
                      {abbreviateAddress(mint.tx_hash, 8)}
                    </span>
                  </td>
                  <td class="text-right">{mint.block_index}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </ScrollContainer>
    </div>
  );
}
